$path = "paytrack-lite-backend\index.js"
$lines = Get-Content $path
$text = $lines -join "`n"

# 1. Add lastLoginAt to schema
$oldSchema = "  role:         { type: String, enum: ['user', 'admin'], default: 'user' },"
$newSchema = @'
  role:         { type: String, enum: ['user', 'admin'], default: 'user' },
  lastLoginAt:  { type: Date, default: null },
'@
$text = $text.Replace($oldSchema, $newSchema)

# 2. Record lastLoginAt on login
$oldLogin = @'
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, businessName: user.businessName, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Login: ${user.email}`);
'@
$newLogin = @'
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });
    user.lastLoginAt = new Date();
    await user.save();
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, businessName: user.businessName, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Login: ${user.email}`);
'@
$text = $text.Replace($oldLogin, $newLogin)

# 3. Full admin dashboard route rewrite
$oldAdmin = @'
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    const totalUsers = users.length;
    const premiumUsers = users.filter(u => u.plan !== 'free' && u.plan !== 'basic').length;
    const [totalSalesCount, totalBookingsCount] = await Promise.all([
      Sale.countDocuments({}),
      Booking.countDocuments({})
    ]);
    res.json({
      success: true,
      metrics: {
        totalUsers,
        premiumUsers,
        totalSales: totalSalesCount,
        totalBookings: totalBookingsCount
      },
      users
    });
  } catch (err) {
    console.error('Admin Fetch Error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin system metrics.' });
  }
});
'@
$newAdmin = @'
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    const totalUsers = users.length;
    const premiumUsers = users.filter(u => u.plan !== 'free' && u.plan !== 'basic').length;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalSalesCount,
      totalBookingsCount,
      totalEventsCount,
      newSignupsThisMonth,
      activeUsers,
      revenueAgg,
      planBreakdownAgg,
      topBusinessTypesAgg
    ] = await Promise.all([
      Sale.countDocuments({}),
      Booking.countDocuments({}),
      Event.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ lastLoginAt: { $gte: thirtyDaysAgo } }),
      Sale.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { businessType: { $ne: null } } },
        { $group: { _id: '$businessType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const planBreakdown = planBreakdownAgg.reduce((acc, p) => {
      acc[p._id || 'free'] = p.count;
      return acc;
    }, {});
    const topBusinessTypes = topBusinessTypesAgg.map(t => ({ type: t._id, count: t.count }));
    const recentSignups = users.slice(0, 10);

    res.json({
      success: true,
      metrics: {
        totalUsers,
        activeUsers,
        newSignupsThisMonth,
        premiumUsers,
        totalRevenue,
        totalSales: totalSalesCount,
        totalBookings: totalBookingsCount,
        totalEvents: totalEventsCount,
        planBreakdown,
        topBusinessTypes
      },
      recentSignups,
      users
    });
  } catch (err) {
    console.error('Admin Fetch Error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin system metrics.' });
  }
});
'@
$text = $text.Replace($oldAdmin, $newAdmin)

Set-Content $path -Value ($text -split "`n")
Write-Host "Done. Checking replacements landed..."
Write-Host "lastLoginAt in schema: $($text -match 'lastLoginAt:\s*\{ type: Date')"
Write-Host "lastLoginAt in login: $($text -match 'user\.lastLoginAt = new Date')"
Write-Host "totalRevenue in route: $($text -match 'const totalRevenue')"