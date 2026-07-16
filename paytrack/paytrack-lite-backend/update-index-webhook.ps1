$path = "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend\index.js"
$content = Get-Content $path -Raw

$oldRequires = "const Booking  = require('./src/models/Booking');"
$newRequires = @"
const Booking  = require('./src/models/Booking');
const Event       = require('./src/models/Event');
const EventTicket  = require('./src/models/EventTicket');
const { ticketHtml } = require('./src/routes/events');
"@

if ($content -notmatch [regex]::Escape($oldRequires)) {
    Write-Host "REQUIRES MARKER NOT FOUND - aborting, no changes made" -ForegroundColor Red
    exit
}
$content = $content.Replace($oldRequires, $newRequires)

$oldBranch = @"
      if (metadata?.bookingId || (reference && reference.startsWith('booking-'))) {
        const bookingId = metadata?.bookingId || reference.replace('booking-', '');
        await Booking.findByIdAndUpdate(bookingId, {
          paymentStatus: 'paid', status: 'confirmed', paymentRef: reference,
        });
      } else {
"@

$newBranch = @"
      if (metadata?.ticketId || (reference && reference.startsWith('event-ticket-'))) {
        const ticketId = metadata?.ticketId || reference.replace('event-ticket-', '');
        const ticket = await EventTicket.findOneAndUpdate(
          { _id: ticketId, paymentStatus: { `$ne: 'paid' } },
          { paymentStatus: 'paid', status: 'valid', paymentRef: reference },
          { new: true }
        );
        if (ticket && resend) {
          const ev = await Event.findById(ticket.eventId);
          if (ev) {
            await resend.emails.send({
              from: EMAIL_FROM,
              to: ticket.buyerEmail,
              subject: ``Your ticket for `${ev.title}``,
              html: ticketHtml(ev, ticket),
            });
          }
        }
      } else if (metadata?.bookingId || (reference && reference.startsWith('booking-'))) {
        const bookingId = metadata?.bookingId || reference.replace('booking-', '');
        await Booking.findByIdAndUpdate(bookingId, {
          paymentStatus: 'paid', status: 'confirmed', paymentRef: reference,
        });
      } else {
"@

if ($content -notmatch [regex]::Escape($oldBranch)) {
    Write-Host "WEBHOOK BRANCH MARKER NOT FOUND - aborting before partial edit (requires change was NOT saved either)" -ForegroundColor Red
    exit
}
$content = $content.Replace($oldBranch, $newBranch)

Set-Content -Path $path -Value $content -NoNewline
Write-Host "index.js updated successfully" -ForegroundColor Green
