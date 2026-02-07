import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { useAuth } from '../../context/AuthContext.js';
import { timetables } from '../../utils/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ScheduleEntry {
  period: number;
  subject_name: string;
  subject_code: string;
  is_lab: boolean;
  class_name: string;
  period_timing?: {
    start_time: string;
    end_time: string;
  };
}

interface FacultySchedule {
  [day: string]: ScheduleEntry[];
}

const FacultyDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mySchedule, setMySchedule] = useState<FacultySchedule>({});
  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [myClasses, setMyClasses] = useState<string[]>([]);
  const [facultyInfo, setFacultyInfo] = useState<{ name: string; faculty_id: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const timetableRef = useRef<HTMLDivElement>(null);

  const workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayLabels: { [key: string]: string } = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday'
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch faculty timetables
        const timetableResponse = await timetables.getByFaculty(currentUser._id);
        const responseData = timetableResponse.data;
        
        console.log('Faculty timetable response:', responseData);
        
        // The backend returns { schedule: {...}, faculty: {...} }
        if (responseData.schedule) {
          setMySchedule(responseData.schedule);
          
          // Extract unique subjects from schedule
          const uniqueSubjects: any[] = [];
          const subjectSet = new Set<string>();
          const classSet = new Set<string>();
          
          Object.values(responseData.schedule).forEach((daySchedule: any) => {
            if (Array.isArray(daySchedule)) {
              daySchedule.forEach((entry: ScheduleEntry) => {
                if (entry.subject_code && !subjectSet.has(entry.subject_code)) {
                  subjectSet.add(entry.subject_code);
                  uniqueSubjects.push({
                    name: entry.subject_name,
                    code: entry.subject_code,
                    is_lab: entry.is_lab
                  });
                }
                if (entry.class_name) {
                  classSet.add(entry.class_name);
                }
              });
            }
          });
          
          setMySubjects(uniqueSubjects);
          setMyClasses(Array.from(classSet));
        }
        
        if (responseData.faculty) {
          setFacultyInfo(responseData.faculty);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching faculty data:', err);
        setError('Failed to load your data. Please try again later.');
        setMySchedule({});
        setMySubjects([]);
        setMyClasses([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Get total periods count
  const getTotalPeriods = (): number => {
    let total = 0;
    Object.values(mySchedule).forEach((daySchedule: any) => {
      if (Array.isArray(daySchedule)) {
        total += daySchedule.length;
      }
    });
    return total;
  };

  // Check if there's any schedule
  const hasSchedule = (): boolean => {
    return Object.values(mySchedule).some((daySchedule: any) => 
      Array.isArray(daySchedule) && daySchedule.length > 0
    );
  };

  // Get max periods in any day (for table structure)
  const getMaxPeriods = (): number => {
    let max = 0;
    Object.values(mySchedule).forEach((daySchedule: any) => {
      if (Array.isArray(daySchedule)) {
        daySchedule.forEach((entry: ScheduleEntry) => {
          if (entry.period > max) max = entry.period;
        });
      }
    });
    return max || 8; // Default 8 periods
  };

  // Get entry for a specific day and period
  const getEntry = (day: string, period: number): ScheduleEntry | null => {
    const daySchedule = mySchedule[day] || [];
    return daySchedule.find((entry: ScheduleEntry) => entry.period === period) || null;
  };

  // Download timetable as Excel
  const downloadAsExcel = () => {
    const maxPeriods = getMaxPeriods();
    const data: any[][] = [];
    
    // Header row
    const header = ['Day', ...Array.from({ length: maxPeriods }, (_, i) => `Period ${i + 1}`)];
    data.push(header);
    
    // Data rows
    workingDays.forEach(day => {
      const row = [dayLabels[day]];
      for (let period = 1; period <= maxPeriods; period++) {
        const entry = getEntry(day, period);
        if (entry) {
          row.push(`${entry.subject_name}\n${entry.class_name}${entry.is_lab ? ' (Lab)' : ''}`);
        } else {
          row.push('');
        }
      }
      data.push(row);
    });
    
    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Day column
      ...Array(maxPeriods).fill({ wch: 25 }) // Period columns
    ];
    
    // Download
    const fileName = `Timetable_${currentUser?.name || 'Faculty'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Download timetable as PDF
  const downloadAsPDF = async () => {
    if (!timetableRef.current) return;
    
    try {
      // Capture the timetable table as canvas
      const canvas = await html2canvas(timetableRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: timetableRef.current.scrollWidth,
        windowHeight: timetableRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions (A4 landscape: 297mm x 210mm)
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = 297; // A4 landscape width in mm
      const pdfHeight = 210; // A4 landscape height in mm
      const margin = 10;
      const contentWidth = pdfWidth - (2 * margin);
      const contentHeight = pdfHeight - 50; // Leave space for header
      const imgAspectRatio = imgWidth / imgHeight;
      
      // Calculate dimensions to fit the image
      let finalWidth = contentWidth;
      let finalHeight = contentWidth / imgAspectRatio;
      
      // If height exceeds available space, scale down
      if (finalHeight > contentHeight) {
        finalHeight = contentHeight;
        finalWidth = contentHeight * imgAspectRatio;
      }
      
      // Center the image
      const xPos = (pdfWidth - finalWidth) / 2;
      const yPos = 40; // Start after header
      
      // Create PDF
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Faculty Timetable', pdfWidth / 2, 15, { align: 'center' });
      
      // Add faculty name
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Faculty: ${currentUser?.name || 'Faculty'}`, pdfWidth / 2, 25, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pdfWidth / 2, 32, { align: 'center' });
      
      // Add the timetable image
      pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight);
      
      // Save PDF
      const fileName = `Timetable_${currentUser?.name || 'Faculty'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Faculty Dashboard</h1>
              <p className="text-lg text-gray-600">
                Welcome back, <span className="font-medium text-blue-700">{currentUser?.name || 'Faculty'}</span>!
              </p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4 bg-white rounded-xl px-6 py-3 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg shadow-sm" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                  <div className="text-3xl font-bold text-blue-600">{getTotalPeriods()}</div>
                  <div className="text-sm text-gray-500">Total Periods</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                  <div className="text-3xl font-bold text-green-600">{myClasses.length}</div>
                  <div className="text-sm text-gray-500">Classes</div>
                </div>
              </div>

              {/* My Subjects Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">My Subjects</h2>
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                
                {mySubjects.length > 0 ? (
                  <div className="space-y-3">
                    {mySubjects.map((subject, idx) => (
                      <div key={idx} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <p className="font-medium text-gray-900">{subject.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600">{subject.code}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            subject.is_lab 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {subject.is_lab ? 'Lab' : 'Theory'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-gray-500">No subjects assigned yet</p>
                  </div>
                )}
              </div>
              
              {/* My Classes Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">My Classes</h2>
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H9m10 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12" />
                    </svg>
                  </div>
                </div>
                
                {myClasses.length > 0 ? (
                  <div className="space-y-2">
                    {myClasses.map((className, idx) => (
                      <div key={idx} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                        <p className="font-medium text-gray-900">{className}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H9m10 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12" />
                    </svg>
                    <p className="text-gray-500">No classes assigned yet</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Main Content - Schedule */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                {/* Schedule Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">My Schedule</h2>
                  
                  <div className="flex space-x-2">
                    {hasSchedule() && (
                      <>
                        <button
                          onClick={downloadAsExcel}
                          className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Excel
                        </button>
                        <button
                          onClick={downloadAsPDF}
                          className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Download PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {!hasSchedule() ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 text-lg">No schedule assigned yet</p>
                    <p className="text-gray-400 mt-2">Your timetable will appear here once assigned by an admin.</p>
                  </div>
                ) : (
                  <div ref={timetableRef} className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Day</th>
                          {Array.from({ length: getMaxPeriods() }, (_, i) => {
                            // Get timing for this period from any entry
                            const periodNum = i + 1;
                            let timing = null;
                            for (const day of workingDays) {
                              const entry = getEntry(day, periodNum);
                              if (entry?.period_timing) {
                                timing = entry.period_timing;
                                break;
                              }
                            }
                            
                            return (
                              <th key={i} className="border border-gray-300 px-3 py-3 text-center font-semibold text-gray-700">
                                <div>Period {periodNum}</div>
                                {timing && (
                                  <div className="text-xs text-gray-500 font-normal mt-1">
                                    {timing.start_time} - {timing.end_time}
                                  </div>
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {workingDays.map(day => (
                          <tr key={day} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium bg-gray-50 text-gray-900">
                              {dayLabels[day]}
                            </td>
                            {Array.from({ length: getMaxPeriods() }, (_, i) => {
                              const periodNum = i + 1;
                              const entry = getEntry(day, periodNum);
                              
                              return (
                                <td
                                  key={i}
                                  className={`border border-gray-300 px-3 py-4 text-center min-w-[150px] ${
                                    entry?.is_lab
                                      ? 'bg-purple-50'
                                      : entry
                                      ? 'bg-blue-50'
                                      : 'bg-white'
                                  }`}
                                >
                                  {entry ? (
                                    <div className="space-y-1">
                                      <div className={`font-semibold text-sm ${
                                        entry.is_lab ? 'text-purple-800' : 'text-blue-800'
                                      }`}>
                                        {entry.subject_name}
                                      </div>
                                      <div className="text-xs text-gray-600 font-medium">
                                        {entry.class_name}
                                      </div>
                                      {entry.is_lab && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-200 text-purple-800 text-xs rounded">
                                          Lab
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Legend */}
                    <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-50 border border-blue-200 mr-2"></div>
                        <span>Theory Class</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-purple-50 border border-purple-200 mr-2"></div>
                        <span>Lab Session</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;
