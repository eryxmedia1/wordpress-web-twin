import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from various headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    const clientIp = cfConnectingIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || 'unknown';
    
    console.log('Detecting geo for IP:', clientIp);

    // Skip geo lookup for localhost/private IPs
    if (clientIp === 'unknown' || clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')) {
      console.log('Local/private IP detected, returning defaults');
      return new Response(JSON.stringify({
        country: 'US',
        country_name: 'United States',
        region: 'NY',
        region_name: 'New York',
        city: 'New York',
        postal: '10001',
        timezone: 'America/New_York',
        ip: clientIp
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use ip-api.com (free, no API key required, 45 requests/min limit)
    const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,zip,timezone`);
    
    if (!geoResponse.ok) {
      throw new Error(`Geo API responded with status ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();
    console.log('Geo API response:', geoData);

    if (geoData.status === 'fail') {
      console.log('Geo lookup failed:', geoData.message);
      // Return defaults on failure
      return new Response(JSON.stringify({
        country: 'US',
        country_name: 'United States',
        region: 'NY',
        region_name: 'New York',
        city: 'New York',
        postal: '10001',
        timezone: 'America/New_York',
        ip: clientIp
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = {
      country: geoData.countryCode || 'US',
      country_name: geoData.country || 'United States',
      region: geoData.region || '',
      region_name: geoData.regionName || '',
      city: geoData.city || '',
      postal: geoData.zip || '',
      timezone: geoData.timezone || 'America/New_York',
      ip: clientIp
    };

    console.log('Returning geo data:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error detecting geo:', error);
    
    // Return defaults on error
    return new Response(JSON.stringify({
      country: 'US',
      country_name: 'United States',
      region: 'NY',
      region_name: 'New York', 
      city: 'New York',
      postal: '10001',
      timezone: 'America/New_York',
      ip: 'unknown',
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
