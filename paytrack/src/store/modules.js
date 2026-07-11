export const getModulesForBusinessType = (businessType) => {
  const base = ['home', 'expenses', 'customers', 'settings'];

  const map = {
    // Bookings + Payments
    therapist:  [...base, 'bookings', 'sales', 'invoices'],
    consultant: [...base, 'bookings', 'sales', 'invoices'],
    coach:      [...base, 'bookings', 'sales', 'invoices'],
    lawyer:     [...base, 'bookings', 'sales', 'invoices'],
    doctor:     [...base, 'bookings', 'sales', 'invoices'],
    tutor:      [...base, 'bookings', 'sales', 'invoices'],
    salon:      [...base, 'bookings', 'sales'],
    fitness:    [...base, 'bookings', 'sales'],

    // Payments and Invoicing Only
    agency:     [...base, 'sales', 'invoices'],
    freelancer: [...base, 'sales', 'invoices'],
    contractor: [...base, 'sales', 'invoices'],

    // Finance and Expense Tracking
    church:     [...base, 'sales'],
    ngo:        [...base, 'sales'],

   clinic:     [...base, 'bookings', 'sales', 'invoices'],
    school:     [...base, 'sales', 'invoices'],
    other:      [...base, 'bookings', 'sales', 'invoices'],
    // Full Business
    shop:       [...base, 'sales', 'invoices'],
    event:      [...base, 'sales', 'invoices'],
    full:       [...base, 'bookings', 'sales', 'invoices'],
  };																																																																			 

  return map[businessType?.toLowerCase()] || [...base, 'sales'];
};