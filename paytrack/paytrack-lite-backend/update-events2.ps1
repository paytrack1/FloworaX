$path = "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend\src\routes\events.js"
$content = Get-Content $path -Raw

$startMarker = "router.post('/public/:id/register'"
$endMarker   = "router.post('/:id/checkin'"

$startIdx = $content.IndexOf($startMarker)
$endIdx   = $content.IndexOf($endMarker)

if ($startIdx -eq -1 -or $endIdx -eq -1 -or $endIdx -le $startIdx) {
    Write-Host "MARKERS NOT FOUND CORRECTLY - aborting, no changes made" -ForegroundColor Red
    Write-Host "startIdx=$startIdx endIdx=$endIdx"
    exit
}

$before = $content.Substring(0, $startIdx)
$after  = $content.Substring($endIdx)

$newRegisterBlock = @'
async function confirmPaidTicket(ticketId, reference) {
  const ticket = await EventTicket.findOneAndUpdate(
    { _id: ticketId, paymentStatus: { $ne: 'paid' } },
    { paymentStatus: 'paid', status: 'valid', paymentRef: reference },
    { new: true }
  );
  if (ticket) {
    const event = await Event.findById(ticket.eventId);
    if (event) await sendEmail(ticket.buyerEmail, `Your ticket for ${event.title}`, ticketHtml(event, ticket));
  }
  return ticket;
}

router.post('/public/:id/register', async (req, res) => {
  const { buyerName, buyerEmail } = req.body;
  if (!buyerName || !buyerEmail)
    return res.status(400).json({ error: 'buyerName and buyerEmail are required' });

  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'active') return res.status(404).json({ error: 'Event not found' });

    const providerAllowed = await requireProviderFeature(event.userId, 'events');
    if (!providerAllowed.allowed) return res.status(providerAllowed.status).json({ error: providerAllowed.error });

    if (event.capacity > 0) {
      const currentCount = await EventTicket.countDocuments({ eventId: event._id, status: { $nin: ['cancelled'] } });
      if (currentCount >= event.capacity) return res.status(400).json({ error: 'This event is fully booked' });
    }

    const ticketCode = await generateUniqueTicketCode();
    const isFree = !event.price || event.price <= 0;

    const ticket = await EventTicket.create({
      eventId: event._id,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.trim(),
      ticketCode,
      paidAmount: event.price || 0,
      paymentStatus: isFree ? 'free' : 'pending',
      status: isFree ? 'valid' : 'pending',
    });

    if (isFree) {
      await sendEmail(ticket.buyerEmail, `Your ticket for ${event.title}`, ticketHtml(event, ticket));
      return res.status(201).json({ success: true, ticket, paymentRequired: false });
    }

    const { data } = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: ticket.buyerEmail,
        amount: Math.round(event.price * 100),
        reference: `event-ticket-${ticket._id}`,
        callback_url: `${FRONTEND_URL}/events/ticket-success`,
        metadata: { ticketId: ticket._id.toString(), eventId: event._id.toString(), buyerName: ticket.buyerName },
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    res.status(201).json({
      success: true, ticket, paymentRequired: true,
      authorizationUrl: data.data.authorization_url, reference: data.data.reference,
    });
  } catch (err) {
    console.error('Register error:', err.stack || err);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    if (event && event.event === 'charge.success') {
      const reference = event.data && event.data.reference;
      if (reference) {
        const { data } = await axios.get(
          `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
          { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );
        if (data && data.data && data.data.status === 'success') {
          const ticketId = data.data.metadata && data.data.metadata.ticketId;
          if (ticketId) await confirmPaidTicket(ticketId, reference);
        }
      }
    }
  } catch (err) {
    console.error('Event webhook error:', err.message);
  }
  res.sendStatus(200);
});

router.get('/verify/:reference', async (req, res) => {
  try {
    const { data } = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${req.params.reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );
    if (data?.data?.status === 'success') {
      const ticketId = data.data.metadata?.ticketId;
      if (ticketId) await confirmPaidTicket(ticketId, req.params.reference);
      res.json({ success: true, message: 'Payment verified and ticket confirmed' });
    } else {
      res.json({ success: false, message: 'Payment not verified' });
    }
  } catch {
    res.status(500).json({ error: 'Verification failed' });
  }
});

'@

$newContent = $before + $newRegisterBlock + $after

$oldConst = "const RESEND_API_KEY = process.env.RESEND_API_KEY;"
$newConst = @'
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL   = 'https://api.paystack.co';
const FRONTEND_URL        = process.env.FRONTEND_URL || 'https://floworax.vercel.app';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
'@

if ($newContent -notmatch [regex]::Escape($oldConst)) {
    Write-Host "CONST LINE NOT FOUND - route block was NOT changed, aborting before partial edit" -ForegroundColor Red
    exit
}
$newContent = $newContent.Replace($oldConst, $newConst)

Set-Content -Path $path -Value $newContent -NoNewline
Write-Host "events.js updated successfully" -ForegroundColor Green