import nodeConsole from 'node:console';
import { AsyncLocalStorage } from 'node:async_hooks';
import { skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { authHandler, initAuthConfig } from '@hono/auth-js';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
import { Hono } from 'hono';
import { contextStorage, getContext } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { requestId } from 'hono/request-id';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
import NeonAdapter from './adapter';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { isAuthAction } from './is-auth-action';
import { API_BASENAME, api } from './route-builder';

const als = new AsyncLocalStorage<{ requestId: string }>();

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = NeonAdapter(pool);

const app = new Hono();

app.use('*', requestId());

app.use('*', (c, next) => {
  const requestId = c.get('requestId');
  return als.run({ requestId }, () => next());
});

app.use(contextStorage());

app.onError((err, c) => {
  if (c.req.method !== 'GET') {
    return c.json(
      {
        error: 'An error occurred in your app',
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
}

if (process.env.AUTH_SECRET) {
  app.use(
    '*',
    initAuthConfig((c) => ({
      secret: c.env.AUTH_SECRET,
      pages: {
        signIn: '/account/signin',
        signOut: '/account/logout',
      },
      skipCSRFCheck,
      session: {
        strategy: 'jwt',
      },
      callbacks: {
        session({ session, token }) {
          if (token.sub) {
            session.user.id = token.sub;
          }
          return session;
        },
      },
      cookies: {
        csrfToken: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
        sessionToken: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
        callbackUrl: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
      },
      providers: [
        Credentials({
          id: 'credentials-signin',
          name: 'Credentials Sign in',
          credentials: {
            email: {
              label: 'Email',
              type: 'email',
            },
            password: {
              label: 'Password',
              type: 'password',
            },
          },
          authorize: async (credentials) => {
            const { email, password } = credentials;
            if (!email || !password) {
              return null;
            }
            if (typeof email !== 'string' || typeof password !== 'string') {
              return null;
            }

            // logic to verify if user exists
            const user = await adapter.getUserByEmail(email);
            if (!user) {
              return null;
            }
            const matchingAccount = user.accounts.find(
              (account) => account.provider === 'credentials'
            );
            const accountPassword = matchingAccount?.password;
            if (!accountPassword) {
              return null;
            }

            const isValid = await verify(accountPassword, password);
            if (!isValid) {
              return null;
            }

            // return user object with the their profile data
            return user;
          },
        }),
        Credentials({
          id: 'credentials-signup',
          name: 'Credentials Sign up',
          credentials: {
            email: {
              label: 'Email',
              type: 'email',
            },
            password: {
              label: 'Password',
              type: 'password',
            },
          },
          authorize: async (credentials) => {
            const { email, password } = credentials;
            if (!email || !password) {
              return null;
            }
            if (typeof email !== 'string' || typeof password !== 'string') {
              return null;
            }

            // logic to verify if user exists
            const user = await adapter.getUserByEmail(email);
            if (!user) {
              const newUser = await adapter.createUser({
                id: crypto.randomUUID(),
                emailVerified: null,
                email,
              });
              await adapter.linkAccount({
                extraData: {
                  password: await hash(password),
                },
                type: 'credentials',
                userId: newUser.id,
                providerAccountId: newUser.id,
                provider: 'credentials',
              });
              return newUser;
            }
            return null;
          },
        }),
      ],
    }))
  );
}
app.all('/integrations/:path{.+}', async (c, next) => {
  const queryParams = c.req.query();
  const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-ignore - this key is accepted even if types not aware and is
    // required for streaming integrations
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
    },
  });
});

// Add Property API
app.post('/api/properties/add', async (c) => {
  try {
    const body = await c.req.json();
    const { ownerEmail, propertyName, address, propertyType, units } = body;

    if (!ownerEmail || !propertyName || !address || !propertyType) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get owner ID from email
    const ownerResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND user_type = $2',
      [ownerEmail, 'owner']
    );

    if (ownerResult.rows.length === 0) {
      return c.json({ error: 'Owner not found' }, 404);
    }

    const ownerId = ownerResult.rows[0].id;

    // Insert property
    const result = await pool.query(
      `INSERT INTO properties (owner_id, name, address, property_type, rent_amount, total_units, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [ownerId, propertyName, address, propertyType, 0, units || 1]
    );

    return c.json({ 
      success: true,
      property: result.rows[0]
    }, 201);
  } catch (error) {
    console.error('Error adding property:', error);
    return c.json({ 
      error: 'Failed to add property',
      details: error.message 
    }, 500);
  }
});

// Get Properties API with occupancy info
app.get('/api/properties/list', async (c) => {
  try {
    const ownerEmail = c.req.query('ownerEmail');
    
    if (!ownerEmail) {
      return c.json({ error: 'Owner email required' }, 400);
    }

    const result = await pool.query(
      `SELECT p.*, 
        COUNT(DISTINCT t.id) as occupied_units,
        p.total_units - COUNT(DISTINCT t.id) as available_units
       FROM properties p
       JOIN users u ON p.owner_id = u.id
       LEFT JOIN tenants t ON t.property_id = p.id AND t.status = 'active'
       WHERE u.email = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [ownerEmail]
    );

    return c.json({ properties: result.rows }, 200);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return c.json({ 
      error: 'Failed to fetch properties',
      details: error.message 
    }, 500);
  }
});

// Generate property connection code
app.post('/api/properties/generate-code', async (c) => {
  try {
    const body = await c.req.json();
    const { propertyId, unit, rentAmount } = body;

    if (!propertyId || !unit || !rentAmount) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Generate 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Store code in database (using created_at for expiry - valid for 7 days)
    await pool.query(
      `INSERT INTO property_codes (property_id, unit_number, rent_amount, code, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days', NOW())
       ON CONFLICT (property_id, unit_number) 
       DO UPDATE SET code = $4, expires_at = NOW() + INTERVAL '7 days', created_at = NOW(), used = false, rent_amount = $3`,
      [propertyId, unit, rentAmount, code]
    );

    return c.json({ 
      success: true,
      code: code
    }, 201);
  } catch (error) {
    console.error('Error generating code:', error);
    return c.json({ 
      error: 'Failed to generate code',
      details: error.message 
    }, 500);
  }
});

// Connect tenant using code
app.post('/api/tenants/connect-with-code', async (c) => {
  try {
    const body = await c.req.json();
    const { code, tenantEmail } = body;

    if (!code || !tenantEmail) {
      return c.json({ error: 'Missing code or email' }, 400);
    }

    // Find valid code
    console.log('Looking for code:', code.toUpperCase());
    
    const codeResult = await pool.query(
      `SELECT pc.*, p.name as property_name 
       FROM property_codes pc
       JOIN properties p ON pc.property_id = p.id
       WHERE pc.code = $1 AND pc.expires_at > NOW() AND pc.used = false`,
      [code.toUpperCase()]
    );

    console.log('Code search result:', codeResult.rows);

    if (codeResult.rows.length === 0) {
      // Check if code exists at all
      const anyCodeResult = await pool.query(
        'SELECT * FROM property_codes WHERE code = $1',
        [code.toUpperCase()]
      );
      
      if (anyCodeResult.rows.length === 0) {
        return c.json({ error: 'Code not found' }, 400);
      }
      
      const existingCode = anyCodeResult.rows[0];
      if (existingCode.used) {
        return c.json({ error: 'This code has already been used' }, 400);
      }
      if (new Date(existingCode.expires_at) < new Date()) {
        return c.json({ error: 'This code has expired' }, 400);
      }
      
      return c.json({ error: 'Invalid or expired code' }, 400);
    }

    const codeData = codeResult.rows[0];

    // Get tenant
    const tenantResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND user_type = $2',
      [tenantEmail, 'tenant']
    );

    if (tenantResult.rows.length === 0) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    const tenant = tenantResult.rows[0];

    // Check if already connected
    const existingConnection = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [tenant.id]
    );

    if (existingConnection.rows.length > 0) {
      return c.json({ error: 'You are already connected to a property' }, 400);
    }

    // Check if unit is already occupied
    const unitCheck = await pool.query(
      'SELECT * FROM tenants WHERE property_id = $1 AND unit_number = $2 AND status = $3',
      [codeData.property_id, codeData.unit_number, 'active']
    );

    if (unitCheck.rows.length > 0) {
      return c.json({ error: 'This unit is already occupied' }, 400);
    }

    // Create tenant connection with rent immediately due
    await pool.query(
      `INSERT INTO tenants (user_id, property_id, unit_number, rent_amount, lease_start_date, status, rent_status, rent_due_day, created_at)
       VALUES ($1, $2, $3, $4, NOW(), 'active', 'pending', 5, NOW())`,
      [tenant.id, codeData.property_id, codeData.unit_number, codeData.rent_amount]
    );

    // Mark code as used
    await pool.query(
      'UPDATE property_codes SET used = true WHERE id = $1',
      [codeData.id]
    );

    return c.json({ 
      success: true,
      message: 'Successfully connected to property',
      property: codeData.property_name
    }, 200);
  } catch (error) {
    console.error('Error connecting with code:', error);
    return c.json({ 
      error: 'Failed to connect',
      details: error.message 
    }, 500);
  }
});

// Get occupied units for a property
app.get('/api/properties/occupied-units', async (c) => {
  try {
    const propertyId = c.req.query('propertyId');
    
    if (!propertyId) {
      return c.json({ error: 'Property ID required' }, 400);
    }

    const result = await pool.query(
      `SELECT unit_number, tenant_user.name as tenant_name
       FROM tenants t
       JOIN users tenant_user ON t.user_id = tenant_user.id
       WHERE t.property_id = $1 AND t.status = 'active'`,
      [propertyId]
    );

    return c.json({ occupiedUnits: result.rows.map(r => r.unit_number) }, 200);
  } catch (error) {
    console.error('Error fetching occupied units:', error);
    return c.json({ 
      error: 'Failed to fetch occupied units',
      details: error.message 
    }, 500);
  }
});

// Add Tenant to Property API
app.post('/api/tenants/add', async (c) => {
  try {
    const body = await c.req.json();
    const { propertyId, tenantEmail, unit, rentAmount, rentDueDate } = body;

    if (!propertyId || !tenantEmail || !rentAmount) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if tenant exists
    const tenantResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND user_type = $2',
      [tenantEmail, 'tenant']
    );

    if (tenantResult.rows.length === 0) {
      return c.json({ error: 'Tenant not found with this email' }, 404);
    }

    const tenant = tenantResult.rows[0];

    // Check if tenant is already assigned to this property
    const existingAssignment = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1 AND property_id = $2',
      [tenant.id, propertyId]
    );

    if (existingAssignment.rows.length > 0) {
      return c.json({ error: 'Tenant is already assigned to this property' }, 400);
    }

    // Check if unit is already occupied
    if (unit) {
      const unitCheck = await pool.query(
        'SELECT * FROM tenants WHERE property_id = $1 AND unit_number = $2 AND status = $3',
        [propertyId, unit, 'active']
      );

      if (unitCheck.rows.length > 0) {
        return c.json({ error: `Unit ${unit} is already occupied` }, 400);
      }
    }

    // Check property capacity
    const propertyCheck = await pool.query(
      `SELECT p.total_units, COUNT(t.id) as occupied_count
       FROM properties p
       LEFT JOIN tenants t ON t.property_id = p.id AND t.status = 'active'
       WHERE p.id = $1
       GROUP BY p.id, p.total_units`,
      [propertyId]
    );

    if (propertyCheck.rows.length > 0) {
      const { total_units, occupied_count } = propertyCheck.rows[0];
      if (parseInt(occupied_count) >= parseInt(total_units)) {
        return c.json({ error: 'Property is at full capacity' }, 400);
      }
    }

    // Insert tenant assignment with rent immediately due
    const result = await pool.query(
      `INSERT INTO tenants (user_id, property_id, unit_number, rent_amount, lease_start_date, status, rent_status, rent_due_day, created_at)
       VALUES ($1, $2, $3, $4, $5, 'active', 'pending', 5, NOW())
       RETURNING *`,
      [tenant.id, propertyId, unit || '', rentAmount, rentDueDate || new Date()]
    );

    return c.json({ 
      success: true,
      tenant: result.rows[0]
    }, 201);
  } catch (error) {
    console.error('Error adding tenant:', error);
    return c.json({ 
      error: 'Failed to add tenant',
      details: error.message 
    }, 500);
  }
});

// Get Tenants API
app.get('/api/tenants/list', async (c) => {
  try {
    const ownerEmail = c.req.query('ownerEmail');
    
    if (!ownerEmail) {
      return c.json({ error: 'Owner email required' }, 400);
    }

    const result = await pool.query(
      `SELECT t.*, tenant_user.name, tenant_user.email, tenant_user.phone, p.name as property_name, p.address 
       FROM tenants t
       JOIN properties p ON t.property_id = p.id
       JOIN users tenant_user ON t.user_id = tenant_user.id
       JOIN users owner_user ON p.owner_id = owner_user.id
       WHERE owner_user.email = $1
       ORDER BY t.created_at DESC`,
      [ownerEmail]
    );

    // Map to include tenant user info
    const tenants = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      property_name: row.property_name,
      address: row.address,
      unit: row.unit_number,
      rent_amount: row.rent_amount,
      rent_status: row.rent_status,
      last_payment_date: row.last_payment_date,
      status: row.status
    }));

    return c.json({ tenants }, 200);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return c.json({ 
      error: 'Failed to fetch tenants',
      details: error.message 
    }, 500);
  }
});

// Get Notifications for Tenant
app.get('/api/notifications/tenant', async (c) => {
  try {
    const tenantEmail = c.req.query('tenantEmail');
    
    if (!tenantEmail) {
      return c.json({ error: 'Tenant email required' }, 400);
    }

    // Get tenant's reminders
    const result = await pool.query(
      `SELECT r.*, p.name as property_name, owner_user.name as owner_name
       FROM reminders r
       JOIN tenants t ON r.tenant_id = t.id
       JOIN users tenant_user ON t.user_id = tenant_user.id
       JOIN properties p ON t.property_id = p.id
       JOIN users owner_user ON p.owner_id = owner_user.id
       WHERE tenant_user.email = $1
       ORDER BY r.sent_at DESC
       LIMIT 20`,
      [tenantEmail]
    );

    return c.json({ notifications: result.rows }, 200);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ 
      error: 'Failed to fetch notifications',
      details: error.message 
    }, 500);
  }
});

// Get Notifications for Owner
app.get('/api/notifications/owner', async (c) => {
  try {
    const ownerEmail = c.req.query('ownerEmail');
    
    if (!ownerEmail) {
      return c.json({ error: 'Owner email required' }, 400);
    }

    // For now, return empty array - can be extended later
    // You can add notifications for: new tenant connections, payment receipts, etc.
    return c.json({ notifications: [] }, 200);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ 
      error: 'Failed to fetch notifications',
      details: error.message 
    }, 500);
  }
});

// Mark notification as read
app.post('/api/notifications/mark-read', async (c) => {
  try {
    const body = await c.req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return c.json({ error: 'Notification ID required' }, 400);
    }

    await pool.query(
      'UPDATE reminders SET read = true WHERE id = $1',
      [notificationId]
    );

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return c.json({ 
      error: 'Failed to mark notification as read',
      details: error.message 
    }, 500);
  }
});

// Remove Tenant API
app.post('/api/tenants/remove', async (c) => {
  try {
    const body = await c.req.json();
    const { tenantId } = body;

    if (!tenantId) {
      return c.json({ error: 'Tenant ID required' }, 400);
    }

    // Delete tenant (this will cascade delete related reminders, payments, etc.)
    const result = await pool.query(
      'DELETE FROM tenants WHERE id = $1 RETURNING *',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    return c.json({ 
      success: true,
      message: 'Tenant removed successfully'
    }, 200);
  } catch (error) {
    console.error('Error removing tenant:', error);
    return c.json({ 
      error: 'Failed to remove tenant',
      details: error.message 
    }, 500);
  }
});

// Send Reminder API
app.post('/api/reminders/send', async (c) => {
  try {
    const body = await c.req.json();
    const { tenantId, message, reminderType } = body;

    if (!tenantId || !message) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get tenant and property details
    const tenantResult = await pool.query(
      `SELECT t.*, tenant_user.name as tenant_name, tenant_user.email as tenant_email,
              p.name as property_name, owner_user.name as owner_name
       FROM tenants t
       JOIN users tenant_user ON t.user_id = tenant_user.id
       JOIN properties p ON t.property_id = p.id
       JOIN users owner_user ON p.owner_id = owner_user.id
       WHERE t.id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    const tenant = tenantResult.rows[0];

    // Store reminder in database
    await pool.query(
      `INSERT INTO reminders (tenant_id, message, reminder_type, sent_at, created_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [tenantId, message, reminderType || 'payment']
    );

    // In a real app, you would send email/SMS here
    // For now, we'll just store it and show success
    
    return c.json({ 
      success: true,
      message: 'Reminder sent successfully',
      tenant: {
        name: tenant.tenant_name,
        email: tenant.tenant_email
      }
    }, 200);
  } catch (error) {
    console.error('Error sending reminder:', error);
    return c.json({ 
      error: 'Failed to send reminder',
      details: error.message 
    }, 500);
  }
});

// Record Payment API
app.post('/api/payments/record', async (c) => {
  try {
    const body = await c.req.json();
    const { tenantEmail, amount, paymentDate, paymentMethod, notes } = body;

    console.log('Recording payment:', { tenantEmail, amount, paymentDate, paymentMethod, notes });

    if (!tenantEmail || !amount) {
      console.error('Missing required fields:', { tenantEmail, amount });
      return c.json({ error: 'Missing required fields: tenantEmail and amount are required' }, 400);
    }

    const paymentDateValue = paymentDate || new Date().toISOString().split('T')[0];

    // Find tenant by email
    const tenantUserResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND user_type = $2',
      [tenantEmail, 'tenant']
    );

    if (tenantUserResult.rows.length === 0) {
      console.error('Tenant user not found:', tenantEmail);
      return c.json({ error: `Tenant with email ${tenantEmail} not found` }, 404);
    }

    const tenantUser = tenantUserResult.rows[0];

    // Get tenant assignment
    const tenantAssignment = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [tenantUser.id]
    );

    if (tenantAssignment.rows.length === 0) {
      console.error('Tenant not assigned to property:', tenantEmail);
      return c.json({ error: `Tenant not assigned to any property` }, 404);
    }

    const tenant = tenantAssignment.rows[0];
    console.log('Tenant found:', { email: tenantEmail, tenantId: tenant.id, userId: tenantUser.id });

    // Insert payment record (using paid_date and due_date from schema)
    const result = await pool.query(
      `INSERT INTO payments (tenant_id, amount, due_date, paid_date, payment_method, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [tenant.id, amount, paymentDateValue, paymentDateValue, paymentMethod || 'cash', 'paid', notes || '']
    );

    console.log('Payment inserted:', result.rows[0]);

    // Update tenant's last_payment_date and rent_status
    const updateResult = await pool.query(
      `UPDATE tenants 
       SET last_payment_date = $1, 
           rent_status = 'paid',
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [paymentDateValue, tenant.id]
    );

    console.log('Tenant updated:', updateResult.rows[0]);

    return c.json({ 
      success: true,
      payment: result.rows[0],
      tenantEmail: tenantEmail,
      message: 'Payment recorded and rent status updated to PAID'
    }, 201);
  } catch (error) {
    console.error('Error recording payment:', error);
    console.error('Error stack:', error.stack);
    return c.json({ 
      error: 'Failed to record payment',
      details: error.message,
      code: error.code
    }, 500);
  }
});

// Get Payment History API
app.get('/api/payments/history', async (c) => {
  try {
    const tenantEmail = c.req.query('tenantEmail');
    
    console.log('Fetching payment history for tenant email:', tenantEmail);
    
    if (!tenantEmail) {
      console.error('No tenant email provided');
      return c.json({ error: 'Tenant email required' }, 400);
    }

    // Find tenant by email
    const tenantUserResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND user_type = $2',
      [tenantEmail, 'tenant']
    );

    if (tenantUserResult.rows.length === 0) {
      console.error('Tenant user not found:', tenantEmail);
      return c.json({ error: `Tenant with email ${tenantEmail} not found` }, 404);
    }

    const tenantUser = tenantUserResult.rows[0];

    // Get tenant assignment
    const tenantAssignment = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [tenantUser.id]
    );

    if (tenantAssignment.rows.length === 0) {
      console.log('Tenant not assigned to property yet:', tenantEmail);
      return c.json({ payments: [] }, 200); // Return empty array if not assigned
    }

    const tenant = tenantAssignment.rows[0];

    // Get payment history
    const result = await pool.query(
      `SELECT * FROM payments 
       WHERE tenant_id = $1 
       ORDER BY paid_date DESC 
       LIMIT 50`,
      [tenant.id]
    );

    console.log(`Found ${result.rows.length} payments for tenant ${tenantEmail} (tenant_id: ${tenant.id})`);

    return c.json({ payments: result.rows }, 200);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    console.error('Error stack:', error.stack);
    return c.json({ 
      error: 'Failed to fetch payment history',
      details: error.message 
    }, 500);
  }
});

// Create Maintenance Request API
app.post('/api/maintenance/create', async (c) => {
  try {
    const body = await c.req.json();
    const { tenantEmail, title, description, priority } = body;

    console.log('Creating maintenance request:', { tenantEmail, title, priority });

    if (!tenantEmail || !title || !description) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Find tenant by email
    const tenantUserResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND user_type = $2',
      [tenantEmail, 'tenant']
    );

    if (tenantUserResult.rows.length === 0) {
      console.error('Tenant user not found:', tenantEmail);
      return c.json({ error: `Tenant with email ${tenantEmail} not found` }, 404);
    }

    const tenantUser = tenantUserResult.rows[0];

    // Get tenant assignment
    const tenantAssignment = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [tenantUser.id]
    );

    if (tenantAssignment.rows.length === 0) {
      console.error('Tenant not assigned to property:', tenantEmail);
      return c.json({ error: `You are not connected to any property. Please connect using a property code.` }, 404);
    }

    const tenant = tenantAssignment.rows[0];
    console.log('Tenant found:', { email: tenantEmail, tenantId: tenant.id, propertyId: tenant.property_id });

    const result = await pool.query(
      `INSERT INTO maintenance_requests (tenant_id, property_id, title, description, priority, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
       RETURNING *`,
      [tenant.id, tenant.property_id, title, description, priority || 'medium']
    );

    console.log('Maintenance request created:', result.rows[0]);

    return c.json({
      success: true,
      request: result.rows[0],
      message: 'Maintenance request submitted successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    return c.json({
      error: 'Failed to create maintenance request',
      details: error.message
    }, 500);
  }
});

// Get Maintenance Requests for Tenant
app.get('/api/maintenance/tenant', async (c) => {
  try {
    const tenantEmail = c.req.query('tenantEmail');

    console.log('Fetching maintenance requests for tenant email:', tenantEmail);

    if (!tenantEmail) {
      return c.json({ error: 'Tenant email required' }, 400);
    }

    // Find tenant by email
    const tenantUserResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND user_type = $2',
      [tenantEmail, 'tenant']
    );

    if (tenantUserResult.rows.length === 0) {
      console.error('Tenant user not found:', tenantEmail);
      return c.json({ error: `Tenant with email ${tenantEmail} not found` }, 404);
    }

    const tenantUser = tenantUserResult.rows[0];

    // Get tenant assignment
    const tenantAssignment = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [tenantUser.id]
    );

    if (tenantAssignment.rows.length === 0) {
      console.log('Tenant not assigned to property yet:', tenantEmail);
      return c.json({ requests: [] }, 200); // Return empty array if not assigned
    }

    const tenant = tenantAssignment.rows[0];

    const result = await pool.query(
      `SELECT * FROM maintenance_requests
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenant.id]
    );

    console.log(`Found ${result.rows.length} maintenance requests for tenant ${tenantEmail} (tenant_id: ${tenant.id})`);

    return c.json({ requests: result.rows }, 200);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    return c.json({
      error: 'Failed to fetch maintenance requests',
      details: error.message
    }, 500);
  }
});

// Get Maintenance Requests for Owner
app.get('/api/maintenance/owner', async (c) => {
  try {
    const ownerEmail = c.req.query('ownerEmail');

    console.log('Fetching maintenance requests for owner email:', ownerEmail);

    if (!ownerEmail) {
      return c.json({ error: 'Owner email required' }, 400);
    }

    // Get all maintenance requests for owner's properties
    const result = await pool.query(
      `SELECT 
        mr.*,
        p.name as property_name,
        p.address as property_address,
        t.unit_number,
        tenant_user.name as tenant_name,
        tenant_user.email as tenant_email,
        tenant_user.phone as tenant_phone
       FROM maintenance_requests mr
       JOIN properties p ON mr.property_id = p.id
       JOIN tenants t ON mr.tenant_id = t.id
       JOIN users tenant_user ON t.user_id = tenant_user.id
       JOIN users owner_user ON p.owner_id = owner_user.id
       WHERE owner_user.email = $1
       ORDER BY 
         CASE mr.status
           WHEN 'pending' THEN 1
           WHEN 'in_progress' THEN 2
           WHEN 'completed' THEN 3
           WHEN 'cancelled' THEN 4
         END,
         mr.created_at DESC`,
      [ownerEmail]
    );

    console.log(`Found ${result.rows.length} maintenance requests for owner ${ownerEmail}`);

    return c.json({ requests: result.rows }, 200);
  } catch (error) {
    console.error('Error fetching owner maintenance requests:', error);
    return c.json({
      error: 'Failed to fetch maintenance requests',
      details: error.message
    }, 500);
  }
});

// Update Maintenance Request Status
app.post('/api/maintenance/update-status', async (c) => {
  try {
    const body = await c.req.json();
    const { requestId, status, ownerEmail } = body;

    console.log('Updating maintenance request status:', { requestId, status, ownerEmail });

    if (!requestId || !status || !ownerEmail) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify owner owns the property
    const verifyResult = await pool.query(
      `SELECT mr.id 
       FROM maintenance_requests mr
       JOIN properties p ON mr.property_id = p.id
       JOIN users owner_user ON p.owner_id = owner_user.id
       WHERE mr.id = $1 AND owner_user.email = $2`,
      [requestId, ownerEmail]
    );

    if (verifyResult.rows.length === 0) {
      return c.json({ error: 'Maintenance request not found or unauthorized' }, 404);
    }

    // Update status
    const updateFields = ['status = $1', 'updated_at = NOW()'];
    const params = [status];
    
    if (status === 'completed') {
      updateFields.push('resolved_at = NOW()');
    }

    const result = await pool.query(
      `UPDATE maintenance_requests 
       SET ${updateFields.join(', ')}
       WHERE id = $${params.length + 1}
       RETURNING *`,
      [...params, requestId]
    );

    console.log('Maintenance request updated:', result.rows[0]);

    return c.json({
      success: true,
      request: result.rows[0],
      message: 'Maintenance request status updated'
    }, 200);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    return c.json({
      error: 'Failed to update maintenance request',
      details: error.message
    }, 500);
  }
});

// Get Documents for Tenant
app.get('/api/documents/tenant', async (c) => {
  try {
    const tenantEmail = c.req.query('tenantEmail');

    console.log('Fetching documents for tenant email:', tenantEmail);

    if (!tenantEmail) {
      return c.json({ error: 'Tenant email required' }, 400);
    }

    // Find tenant by email
    const tenantUserResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND user_type = $2',
      [tenantEmail, 'tenant']
    );

    if (tenantUserResult.rows.length === 0) {
      console.error('Tenant user not found:', tenantEmail);
      return c.json({ error: `Tenant with email ${tenantEmail} not found` }, 404);
    }

    const tenantUser = tenantUserResult.rows[0];

    // Get tenant assignment
    const tenantAssignment = await pool.query(
      'SELECT * FROM tenants WHERE user_id = $1',
      [tenantUser.id]
    );

    if (tenantAssignment.rows.length === 0) {
      console.log('Tenant not assigned to property yet:', tenantEmail);
      return c.json({ documents: [] }, 200);
    }

    const tenant = tenantAssignment.rows[0];

    // Get documents for this tenant
    const result = await pool.query(
      `SELECT * FROM documents
       WHERE tenant_id = $1 OR property_id = $2
       ORDER BY created_at DESC`,
      [tenant.id, tenant.property_id]
    );

    console.log(`Found ${result.rows.length} documents for tenant ${tenantEmail}`);

    return c.json({ documents: result.rows }, 200);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return c.json({
      error: 'Failed to fetch documents',
      details: error.message
    }, 500);
  }
});

// Helper function to calculate rent status
function calculateRentStatus(lastPaymentDate: string | null, rentDueDay: number): { status: string, dueDate: string, daysUntilDue: number } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  
  // Calculate this month's due date
  const thisDueDate = new Date(currentYear, currentMonth, rentDueDay);
  
  // If never paid before (new tenant)
  if (!lastPaymentDate) {
    const daysUntilDue = Math.ceil((thisDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (currentDay > rentDueDay) {
      // Already past due date - overdue
      return {
        status: 'overdue',
        dueDate: thisDueDate.toISOString().split('T')[0],
        daysUntilDue: daysUntilDue
      };
    } else {
      // Before due date - pending
      return {
        status: 'pending',
        dueDate: thisDueDate.toISOString().split('T')[0],
        daysUntilDue: daysUntilDue
      };
    }
  }
  
  // Check if last payment was this month
  const paymentDate = new Date(lastPaymentDate);
  const paymentMonth = paymentDate.getMonth();
  const paymentYear = paymentDate.getFullYear();
  
  // If payment was made this month
  if (paymentYear === currentYear && paymentMonth === currentMonth) {
    // Calculate next due date
    const nextDueDate = new Date(currentYear, currentMonth + 1, rentDueDay);
    const daysUntil = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      status: 'paid',
      dueDate: nextDueDate.toISOString().split('T')[0],
      daysUntilDue: daysUntil
    };
  }
  
  // Not paid this month - check if overdue
  const daysUntilDue = Math.ceil((thisDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (currentDay > rentDueDay) {
    // Past due date
    return {
      status: 'overdue',
      dueDate: thisDueDate.toISOString().split('T')[0],
      daysUntilDue: daysUntilDue
    };
  } else {
    // Before due date
    return {
      status: 'pending',
      dueDate: thisDueDate.toISOString().split('T')[0],
      daysUntilDue: daysUntilDue
    };
  }
}

// Get tenant info API
app.get('/api/tenants/info', async (c) => {
  try {
    const email = c.req.query('email');
    
    if (!email) {
      return c.json({ error: 'Email required' }, 400);
    }

    // Get tenant from users table
    const tenantResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND user_type = $2',
      [email, 'tenant']
    );

    if (tenantResult.rows.length === 0) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    const tenant = tenantResult.rows[0];

    // Get tenant assignment from tenants table
    const assignmentResult = await pool.query(
      `SELECT t.*, p.*, owner_user.name as owner_name, owner_user.email as owner_email, owner_user.phone as owner_phone
       FROM tenants t
       JOIN properties p ON t.property_id = p.id
       JOIN users owner_user ON p.owner_id = owner_user.id
       WHERE t.user_id = $1`,
      [tenant.id]
    );

    if (assignmentResult.rows.length === 0) {
      // Not assigned to any property yet
      return c.json({
        tenant: {
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone
        },
        property: null,
        owner: null,
        rent: null
      }, 200);
    }

    const assignment = assignmentResult.rows[0];
    
    // Calculate current rent status
    const rentInfo = calculateRentStatus(
      assignment.last_payment_date, 
      assignment.rent_due_day || 1
    );

    return c.json({
      tenant: {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        tenantId: assignment.id // Tenant assignment ID for payment history
      },
      property: {
        id: assignment.property_id,
        name: assignment.name,
        address: assignment.address,
        type: assignment.property_type,
        unit: assignment.unit_number
      },
      owner: {
        name: assignment.owner_name,
        email: assignment.owner_email,
        phone: assignment.owner_phone
      },
      rent: {
        amount: parseFloat(assignment.rent_amount) || 0,
        dueDate: rentInfo.dueDate,
        status: rentInfo.status,
        daysUntilDue: rentInfo.daysUntilDue,
        lastPaymentDate: assignment.last_payment_date,
        rentDueDay: assignment.rent_due_day || 1
      }
    }, 200);
  } catch (error) {
    console.error('Error fetching tenant info:', error);
    return c.json({ 
      error: 'Failed to fetch tenant info',
      details: error.message 
    }, 500);
  }
});

// Custom signin endpoint - must be before auth middleware
app.post('/api/auth/signin', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    const { verify: argonVerify } = await import('argon2');

    // Get user from database
    const user = await adapter.getUserByEmail(email);
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Find credentials account
    const matchingAccount = user.accounts.find(
      (account) => account.provider === 'credentials'
    );
    const accountPassword = matchingAccount?.password;
    if (!accountPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await argonVerify(accountPassword, password);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Get user type from users table
    const userInfo = await pool.query(
      'SELECT user_type FROM users WHERE email = $1',
      [email]
    );
    const userType = userInfo.rows[0]?.user_type || 'tenant';

    // Return success with user data
    return c.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: userType
      }
    }, 200);
  } catch (error) {
    console.error('Signin error:', error);
    return c.json({ 
      error: 'Failed to sign in',
      details: error.message 
    }, 500);
  }
});

// Direct signup endpoint as fallback (also before auth middleware)
app.post('/api/auth/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, phone, password, userType } = body;

    if (!name || !email || !password || !userType) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const { hash: argonHash } = await import('argon2');

    // Check if user already exists
    const existingAuthUser = await adapter.getUserByEmail(email);
    if (existingAuthUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Hash password
    const passwordHash = await argonHash(password);

    // Create auth user
    const authUser = await adapter.createUser({
      id: crypto.randomUUID(),
      emailVerified: null,
      email,
      name,
    });

    // Create auth account with password
    await adapter.linkAccount({
      extraData: {
        password: passwordHash,
      },
      type: 'credentials',
      userId: authUser.id,
      providerAccountId: authUser.id,
      provider: 'credentials',
    });

    // Create user in main users table
    await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, user_type) VALUES ($1, $2, $3, $4, $5)',
      [name, email, phone || '', passwordHash, userType]
    );

    return c.json({ 
      message: 'Account created successfully',
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        userType: userType
      }
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ 
      error: 'Failed to create account',
      details: error.message 
    }, 500);
  }
});

// Update User Profile API
app.post('/api/users/update-profile', async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, phone } = body;

    console.log('Updating profile for:', email);

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Update user in database
    const result = await pool.query(
      `UPDATE users 
       SET name = $1, 
           phone = $2,
           updated_at = NOW()
       WHERE email = $3
       RETURNING id, name, email, phone, user_type as "userType"`,
      [name, phone || null, email]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    console.log('Profile updated successfully:', result.rows[0]);

    return c.json({
      success: true,
      user: result.rows[0],
      message: 'Profile updated successfully'
    }, 200);
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({
      error: 'Failed to update profile',
      details: error.message
    }, 500);
  }
});

// Auth middleware for other auth actions (after custom endpoints)
app.use('/api/auth/*', async (c, next) => {
  if (isAuthAction(c.req.path)) {
    return authHandler()(c, next);
  }
  return next();
});

app.route(API_BASENAME, api);

export default await createHonoServer({
  app,
  defaultLogger: false,
});
