// Helper function to get month name from month number
export const  getMonthName=(monthNumber)=> {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return monthNames[monthNumber - 1];
  }