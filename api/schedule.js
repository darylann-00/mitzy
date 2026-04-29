export const config = { runtime: "edge" };

function corsHeaders(req) {
  const allowed = process.env.ALLOWED_ORIGIN || '';
  const origin  = req.headers.get('origin') || '';
  const match   = allowed && origin === allowed ? origin : null;
  return {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    ...(match ? { 'Access-Control-Allow-Origin': match } : {}),
  };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { taskLabel, taskNote, date, time, timeZone, accessToken } = body;
  if (!taskLabel || !date || !accessToken) {
    return new Response("Missing required fields", { status: 400 });
  }
  if (time && !timeZone) {
    return new Response("timeZone required when time is provided", { status: 400 });
  }

  let start, end;
  if (time) {
    // Timed event: 60-minute duration. Send naive local datetime + timeZone;
    // Google interprets it in the supplied zone.
    const [h, m] = time.split(':').map(Number);
    const pad = (n) => String(n).padStart(2, '0');
    const startLocal = `${date}T${pad(h)}:${pad(m)}:00`;
    let endDateStr = date;
    let endH = h + 1;
    if (endH >= 24) {
      endH -= 24;
      const next = new Date(`${date}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      endDateStr = next.toISOString().split('T')[0];
    }
    const endLocal = `${endDateStr}T${pad(endH)}:${pad(m)}:00`;
    start = { dateTime: startLocal, timeZone };
    end   = { dateTime: endLocal,   timeZone };
  } else {
    // All-day event: exclusive end date (day after).
    const endDate = new Date(date);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];
    start = { date };
    end   = { date: endDateStr };
  }

  const event = {
    summary: taskLabel,
    ...(taskNote ? { description: taskNote } : {}),
    start,
    end,
    reminders: {
      useDefault: false,
      overrides:  [{ method: 'popup', minutes: 60 }],
    },
  };

  const calRes = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!calRes.ok) {
    const err = await calRes.text();
    return new Response(`Google Calendar error: ${err}`, { status: 502 });
  }

  const data = await calRes.json();
  return new Response(JSON.stringify({ eventId: data.id }), {
    headers: { 'content-type': 'application/json', ...corsHeaders(req) },
  });
}
