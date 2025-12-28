import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const OWNER_EMAIL = 'canteen@vit.edu';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, x-owner-email",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/canteen-api/', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (path === 'healthz' && req.method === 'GET') {
      return new Response(
        JSON.stringify({ status: 'ok', message: 'Smart Food Canteen API is running' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path === 'login' && req.method === 'POST') {
      const { email, password } = await req.json();

      const emailRegex = /^[a-zA-Z]+\.[0-9]+@vit\.edu$/;
      if (!emailRegex.test(email) && email !== OWNER_EMAIL) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format. Use: firstname.PRN@vit.edu' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      let prnFromEmail = '';
      if (email === OWNER_EMAIL) {
        prnFromEmail = 'canteen';
      } else {
        prnFromEmail = email.split('.')[1].split('@')[0];
      }

      if (password !== prnFromEmail) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials. Password must match PRN.' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, role, full_name')
        .eq('email', email)
        .eq('prn_hash', password)
        .maybeSingle();

      if (error || !user) {
        return new Response(
          JSON.stringify({ error: 'User not found or invalid credentials' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, user }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path === 'orders' && req.method === 'POST') {
      const { userId, items, total, paymentMethod, paymentStatus } = await req.json();

      if (!userId || !items || !total) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: userId, items, total' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      const paymentTime = new Date().toISOString();
      const validTillTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      const paymentData = {
        studentName: userData?.full_name || 'Student',
        studentEmail: userData?.email || '',
      };

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          items: items,
          total: total,
          status: 'pending',
          payment_method: paymentMethod || 'CASH',
          payment_status: paymentStatus || 'CASH',
          payment_time: paymentTime,
          valid_till_time: validTillTime,
          payment_data: paymentData,
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to create order', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const receipt = {
        studentName: userData?.full_name || 'Student',
        studentEmail: userData?.email || '',
        orderId: order.id,
        items: items,
        totalAmount: total,
        paymentMethod: paymentMethod || 'CASH',
        paymentStatus: paymentStatus === 'PAID' ? 'SUCCESS' : 'PENDING',
        paymentTime: paymentTime,
        validTillTime: validTillTime,
      };

      return new Response(
        JSON.stringify({ success: true, order, receipt }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path === 'orders/all' && req.method === 'GET') {
      const ownerEmail = req.headers.get('x-owner-email');

      if (ownerEmail !== OWNER_EMAIL) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Only owner can access all orders.' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch orders', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, orders }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path.startsWith('orders/') && req.method === 'PATCH') {
      const parts = path.split('/');
      const orderId = parts[1];
      const ownerEmail = req.headers.get('x-owner-email');

      if (ownerEmail !== OWNER_EMAIL) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Only owner can update orders.' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { status } = await req.json();

      if (!status || !['ACCEPTED', 'READY', 'COMPLETED'].includes(status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be: ACCEPTED, READY, or COMPLETED' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: order, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to update order', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, order }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (path.startsWith('orders/') && req.method === 'GET') {
      const userId = path.split('/')[1];

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch orders', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, orders }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
