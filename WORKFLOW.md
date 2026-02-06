# AI Timetable Generator - Complete Workflow

## 🎯 Overview
This system generates AI-powered timetables for educational institutions using class structures, faculty assignments, and intelligent scheduling algorithms.

---

## 📋 Complete Flow (Step-by-Step)

### **PHASE 1: System Setup**

#### Step 1.1: Configure Academic Year
📍 **Page**: Admin Dashboard → Academic Year Settings

1. Navigate to "Manage" → "Academic Year Settings"
2. Create a new academic year (e.g., "2025-2026")
3. Set start and end dates
4. Click "Create Academic Year"
5. **Activate** the academic year to make it current

---

#### Step 1.2: Add Classes
📍 **Page**: Admin Dashboard → Manage Classes

1. Navigate to "Manage" → "Classes"
2. Click "Add Class"
3. Fill in:
   - Class Name (e.g., "2ND CSE A (CSE - Year 2)")
   - Branch: CSE, ECE, MECH, etc.
   - Year: 1, 2, 3, or 4
   - Section: A, B, C (optional)
4. Click "Create Class"

**Bulk Upload Option:**
- Download the CSV template
- Fill in multiple classes
- Upload the CSV file

---

#### Step 1.3: Add Subjects
📍 **Page**: Admin Dashboard → Manage Subjects

1. Navigate to "Manage" → "Subjects"
2. Click "Add Subject"
3. Fill in:
   - Subject Name (e.g., "Data Structures")
   - Subject Code (e.g., "CS201")
   - Is Lab? (Check if it's a lab subject)
   - Credit Hours
   - Default Duration (periods per session)
4. Click "Create Subject"

**Bulk Upload Option:**
- Download the CSV template
- Fill in multiple subjects
- Upload the CSV file

---

#### Step 1.4: Add Faculty Members
📍 **Page**: Admin Dashboard → Manage Faculty

1. Navigate to "Manage" → "Faculty"
2. Click "Add Faculty"
3. Fill in:
   - Name
   - Faculty ID
   - Email
   - Phone Number
   - Department
   - Password (for their login)
4. Click "Create Faculty"

**Bulk Upload Option:**
- Download the CSV template
- Fill in multiple faculty members
- Upload the CSV file

---

### **PHASE 2: Create Timetable Structure**

#### Step 2.1: Design Period Timings (Template)
📍 **Page**: Admin Dashboard → Period Timing Canvas

1. Navigate to "Manage" → "Period Timing Canvas"
2. Configure:
   - **Schedule Name**: e.g., "Standard 6-Period Day"
   - **Start Time**: e.g., 09:00
   - **Periods per Day**: e.g., 6
   - **Standard Period Duration**: e.g., 50 minutes
   - **Break Frequency**: Every 2 periods
   - **Break Duration**: 15 minutes
   - **Lunch Break After Period**: Period 4
   - **Lunch Duration**: 60 minutes
3. Click "Generate Schedule"
4. Review the generated period timings
5. **Save as Template** for reuse

**Example Output:**
```
Period 1: 09:00 - 09:50
Period 2: 09:55 - 10:45
Break:    10:45 - 11:00
Period 3: 11:00 - 11:50
Period 4: 11:55 - 12:45
Lunch:    12:45 - 01:45
Period 5: 01:45 - 02:35
Period 6: 02:40 - 03:30
```

---

#### Step 2.2: Create Timetable Structure
📍 **Page**: Admin Dashboard → Manage Timetables

1. Navigate to "Manage" → "Manage Timetables"
2. Click "Create Timetable Structure"
3. Fill in:
   - **Select Class**: Choose the class (e.g., "2ND CSE A")
   - **Academic Year**: e.g., "2025-2026"
   - **Use Template**: Select your saved period timing template (optional)
   - **Periods per Day**: Auto-filled if template selected
4. Configure **Timetable Guidelines**:
   - ✅ Minimize consecutive faculty periods
   - ✅ Labs once per week
   - ✅ Sports last period on: Friday
   - ✅ Break after periods: [2, 4]
5. Click "Create Structure"

**Result**: An empty timetable structure ready for AI generation

---

### **PHASE 3: AI Timetable Generation**

#### Step 3.1: Generate Timetable
📍 **Page**: Admin Dashboard → Generate Timetable

1. Navigate to "Generate Timetable"
2. **Step 1**: Select Class
   - Choose the class (e.g., "2ND CSE A")
   - Click the class card
3. **Step 2**: Select Timetable Structure
   - Choose the timetable structure you created
   - Shows: Academic year, periods per day, last generated date
   - Click the timetable card
4. **Step 3**: Assign Faculty to Subjects
   - For each subject in the class:
     - Select the faculty member who will teach it
     - Verify the number of periods needed
   - Ensure all subjects have faculty assigned
5. Click "Generate Timetable with AI"

**AI Processing:**
- The system uses AI algorithms to:
  - Schedule all subjects across the week
  - Avoid faculty conflicts (no parallel classes)
  - Minimize consecutive periods for same faculty
  - Place labs consecutively (2-3 periods)
  - Optimize for guidelines (sports on Friday, etc.)
  - Balance workload across days

**Generation Time**: 30-60 seconds depending on complexity

---

#### Step 3.2: View Generated Timetable
📍 **Page**: View Results (after generation)

1. Click "View Results" tab
2. Review the timetable:
   - See all days (Monday - Saturday)
   - Each period shows: Subject, Faculty, Room (if assigned)
   - Labs are marked differently
   - Breaks and lunch breaks are clearly shown

**Timetable Display:**
```
MONDAY
Period 1 (09:00-09:50): Data Structures - Dr. Smith
Period 2 (09:55-10:45): DBMS - Dr. Johnson
Break (10:45-11:00)
Period 3 (11:00-11:50): OS Lab - Dr. Williams
Period 4 (11:55-12:45): OS Lab - Dr. Williams
...
```

---

### **PHASE 4: Edit & Finalize**

#### Step 4.1: Manual Adjustments (Optional)
If you need to make changes:
1. Click on any period in the timetable
2. Change the subject or faculty
3. Click "Save Changes"

#### Step 4.2: Regenerate (if needed)
If you want to try a different AI arrangement:
1. Go back to "Generate" tab
2. Optionally adjust faculty assignments
3. Click "Regenerate Timetable"

---

## 🔄 Common Workflows

### Adding a New Class Mid-Semester
1. Go to Manage Classes → Add Class
2. Go to Manage Timetables → Create Structure
3. Use existing template for period timings
4. Generate Timetable → Select new class → Assign faculty → Generate

### Updating Faculty Assignments
1. Go to Manage Faculty → Edit faculty member
2. Update their subjects_taught
3. Regenerate affected timetables

### Creating Multiple Timetables Quickly
1. Create one complete template with period timings
2. Create timetable structures for all classes using the same template
3. Generate timetables one by one (selecting different faculty per class)

---

## ❌ Common Issues & Solutions

### "No timetable templates found"
**Problem**: No timetable structure exists for the selected class
**Solution**: 
1. Go to "Manage Timetables"
2. Create a timetable structure for that class
3. Return to "Generate Timetable"

### "Please assign faculty to all subjects"
**Problem**: Some subjects don't have faculty assigned in Step 3
**Solution**: Scroll through all subjects and assign faculty to each one

### "AI generation failed"
**Problem**: Constraints are too restrictive (no valid solution)
**Solution**:
1. Check if faculty have conflicts (teaching multiple classes same time)
2. Reduce number of constraints in guidelines
3. Ensure enough faculty for all subjects

### Timetable looks unbalanced
**Problem**: Some days have too many periods
**Solution**: Regenerate with adjusted guidelines or manually redistribute

---

## 🎓 Best Practices

1. **Create Templates First**: Design period timing templates before creating multiple timetable structures

2. **Standardize Period Timings**: Use the same template for all classes in a year for consistency

3. **Faculty Workload**: Assign faculty to subjects thoughtfully to avoid overloading

4. **Lab Scheduling**: Ensure labs have 2-3 consecutive periods available

5. **Test with One Class**: Generate for one class first, verify it works, then scale up

6. **Save Frequently**: After each major step, verify the data is saved

7. **Regular Backups**: Download/export timetables periodically

---

## 📊 System Architecture

```
Frontend (React + TypeScript)
    ↓
API Layer (axios)
    ↓
Backend (Node.js + Express)
    ↓
AI Generation Engine
    ↓
MongoDB Database
```

**Key Models:**
- Class: Stores class information
- Subject: Course catalog
- User: Faculty and admin accounts
- Timetable: Main timetable structure with schedule
- Template: Reusable period timing configurations
- Schedule: Stores period timing details

---

## 🚀 Quick Start Checklist

- [ ] Configure academic year and activate it
- [ ] Add at least one class
- [ ] Add subjects (minimum 5-6 for testing)
- [ ] Add faculty members
- [ ] Create period timing template in Canvas
- [ ] Create timetable structure using the template
- [ ] Generate timetable with AI
- [ ] Review and adjust as needed

---

## 📞 Support

For issues or questions:
1. Check this workflow document
2. Review error messages in the UI
3. Check browser console for detailed errors
4. Verify all prerequisite data exists (classes, subjects, faculty)

---

**Last Updated**: February 4, 2026
**Version**: 1.0
