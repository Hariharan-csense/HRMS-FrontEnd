// Payroll calculation utilities

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: "present" | "absent" | "half" | "miss";
  hoursWorked: number;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  leaveType: "paid" | "unpaid" | "lwp" | "sick" | "casual";
  startDate: string;
  endDate: string;
  status: "approved" | "pending" | "rejected";
}

/**
 * Calculate payable days for an employee in a given month
 * Based on: Present days + Paid leave days + (Half days * 0.5) - Loss of pay days
 */
export function calculatePayableDays(
  employeeId: string,
  monthYear: string, // Format: YYYY-MM
  attendanceRecords: AttendanceRecord[],
  leaveRecords: LeaveRecord[] = []
): {
  payableDays: number;
  breakdown: {
    presentDays: number;
    halfDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    absentDays: number;
    totalDays: number;
  };
} {
  // Parse month and year
  const [year, month] = monthYear.split("-");
  
  // Get all days in the month
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  
  // Filter attendance records for this employee and month
  const monthAttendance = attendanceRecords.filter((record) => {
    if (record.employeeId !== employeeId) return false;
    const recordDate = record.date.substring(0, 7); // Get YYYY-MM
    return recordDate === monthYear;
  });

  // Filter leave records for this employee and month
  const monthLeaves = leaveRecords.filter((leave) => {
    if (leave.employeeId !== employeeId || leave.status !== "approved") return false;
    
    const startDate = leave.startDate.substring(0, 7);
    const endDate = leave.endDate.substring(0, 7);
    
    // Check if leave overlaps with this month
    return startDate <= monthYear && endDate >= monthYear;
  });

  // Calculate attendance breakdown
  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  const attendedDates = new Set<string>();

  monthAttendance.forEach((record) => {
    attendedDates.add(record.date);
    
    if (record.status === "present") {
      presentDays += 1;
    } else if (record.status === "half") {
      halfDays += 0.5;
    } else if (record.status === "absent" || record.status === "miss") {
      absentDays += 1;
    }
  });

  // Calculate leave breakdown
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;

  monthLeaves.forEach((leave) => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    
    // Count days in this month for this leave
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      const [leaveYear, leaveMonth] = dateStr.split("-");
      
      // Only count if in current month and not already marked as present/absent
      if (`${leaveYear}-${leaveMonth}` === monthYear && !attendedDates.has(dateStr)) {
        if (leave.leaveType === "paid" || leave.leaveType === "sick" || leave.leaveType === "casual") {
          paidLeaveDays += 1;
        } else if (leave.leaveType === "unpaid" || leave.leaveType === "lwp") {
          unpaidLeaveDays += 1;
        }
      }
      
      current.setDate(current.getDate() + 1);
    }
  });

  // Calculate total payable days
  // Payable Days = Present Days + (Half Days) + Paid Leave Days - Loss of Pay (Unpaid Leave)
  const payableDays = presentDays + halfDays + paidLeaveDays;

  return {
    payableDays: Math.min(payableDays, daysInMonth), // Can't exceed days in month
    breakdown: {
      presentDays,
      halfDays,
      paidLeaveDays,
      unpaidLeaveDays,
      absentDays,
      totalDays: daysInMonth,
    },
  };
}

/**
 * Calculate payable days for a month (working days calculation)
 * Simplified version: Based on standard 26 working days or provided attendance
 */
export function getDefaultPayableDays(
  monthYear: string,
  attendanceRecords: AttendanceRecord[],
  employeeId: string
): number {
  const [year, month] = monthYear.split("-");
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();

  // If we have attendance records for this employee and month, use them
  if (attendanceRecords.some((r) => r.employeeId === employeeId && r.date.startsWith(monthYear))) {
    const result = calculatePayableDays(employeeId, monthYear, attendanceRecords);
    return result.payableDays;
  }

  // Otherwise, return standard working days (approximately 26 days per month)
  // Simplified: assume 26 days as standard
  return 26;
}
