import React, { useState, useMemo, useCallback } from 'react';
import type { Employee } from './types';
import { useEmployees } from './hooks/useEmployees';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import EmployeeTable from './components/EmployeeTable';
import EmployeeModal from './components/EmployeeModal';
import ConfirmationModal from './components/ConfirmationModal';
import FilterControls from './components/FilterControls';
import StatsCards from './components/StatsCards';
import AIQueryGenerator from './components/AIQueryGenerator';

export default function App(): React.ReactNode {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  // State for sorting and filtering
  const [sortKey, setSortKey] = useState<keyof Employee>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [positionFilter, setPositionFilter] = useState<string>('All Positions');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All Departments');

  const handleAddEmployeeClick = useCallback(() => {
    setSelectedEmployee(null);
    setEmployeeModalOpen(true);
  }, []);

  const handleEditEmployee = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeModalOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((id: string) => {
    setEmployeeToDelete(id);
    setConfirmModalOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete);
      setEmployeeToDelete(null);
      setConfirmModalOpen(false);
    }
  }, [employeeToDelete, deleteEmployee]);

  const handleSaveEmployee = useCallback((employee: Employee) => {
    if (selectedEmployee) {
      updateEmployee(employee);
    } else {
      addEmployee(employee);
    }
    setEmployeeModalOpen(false);
    setSelectedEmployee(null);
  }, [selectedEmployee, addEmployee, updateEmployee]);

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const uniquePositions = useMemo(() => {
    const positions = new Set(employees.map(e => e.position));
    return ['All Positions', ...Array.from(positions).sort()];
  }, [employees]);

  const uniqueDepartments = useMemo(() => {
    const departments = new Set(employees.map(e => e.department));
    return ['All Departments', ...Array.from(departments).sort()];
  }, [employees]);

  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.isActive).length;
    const totalDepartments = new Set(employees.map(e => e.department)).size;
    const monthlyPayroll = employees.reduce((sum, e) => sum + (e.isActive ? e.income : 0), 0) / 12;
    return { totalEmployees, activeEmployees, totalDepartments, monthlyPayroll };
  }, [employees]);

  const processedEmployees = useMemo(() => {
    let result = [...employees];

    // 1. Search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(emp =>
        emp.name.toLowerCase().includes(lowercasedTerm) ||
        emp.email.toLowerCase().includes(lowercasedTerm) ||
        emp.position.toLowerCase().includes(lowercasedTerm) ||
        emp.department.toLowerCase().includes(lowercasedTerm) ||
        emp.employeeId.toLowerCase().includes(lowercasedTerm)
      );
    }

    // 2. Department filter
    if (departmentFilter && departmentFilter !== 'All Departments') {
      result = result.filter(emp => emp.department === departmentFilter);
    }

    // 3. Position filter
    if (positionFilter && positionFilter !== 'All Positions') {
      result = result.filter(emp => emp.position === positionFilter);
    }

    // 4. Sorting
    if (sortKey) {
      result.sort((a, b) => {
        if (sortKey === 'isActive') {
          // Special case for boolean sorting
          const valA = a.isActive ? 1 : 0;
          const valB = b.isActive ? 1 : 0;
          return sortOrder === 'asc' ? valB - valA : valA - valB;
        }

        const valA = a[sortKey];
        const valB = b[sortKey];

        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [employees, searchTerm, departmentFilter, positionFilter, sortKey, sortOrder]);

  const handleExportCsv = useCallback(() => {
    try {
      if (processedEmployees.length === 0) {
        alert("No employee data to export.");
        return;
      }

      const headers = ["ID", "Name", "Email", "Contact", "Address", "Position", "Department", "Status", "Annual Income", "Performance", "Date of Birth", "Joining Date", "Pay Frequency"];
      
      const escapeCsvField = (field: string | number | boolean): string => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      const csvRows = [
        headers.join(','),
        ...processedEmployees.map(emp => [
          escapeCsvField(emp.employeeId),
          escapeCsvField(emp.name),
          escapeCsvField(emp.email),
          escapeCsvField(emp.contact),
          escapeCsvField(emp.address),
          escapeCsvField(emp.position),
          escapeCsvField(emp.department),
          escapeCsvField(emp.isActive ? 'Active' : 'Inactive'),
          escapeCsvField(emp.income),
          escapeCsvField(emp.performance),
          escapeCsvField(emp.dateOfBirth),
          escapeCsvField(emp.joiningDate),
          escapeCsvField(emp.payFrequency),
        ].join(','))
      ];
      
      const csvData = csvRows.join('\n');
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "employees.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Failed to generate CSV:", error);
      alert(`An error occurred while generating the CSV. Please check the console for details. \nError: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [processedEmployees]);


  return (
    <div className="min-h-screen text-gray-200 font-sans overflow-hidden">
      <Header onAddEmployee={handleAddEmployeeClick} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-app-slide-up opacity-0" style={{ animationDelay: '0.1s' }}>
          <StatsCards 
            totalEmployees={stats.totalEmployees}
            activeEmployees={stats.activeEmployees}
            totalDepartments={stats.totalDepartments}
            monthlyPayroll={stats.monthlyPayroll}
          />
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden animate-app-slide-up opacity-0 ring-1 ring-black ring-opacity-20" style={{ animationDelay: '0.2s' }}>
          <div className="p-6 md:p-8 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Employee DB</h2>
            <p className="mt-1 text-sm text-gray-400">Manage your team's information efficiently.</p>
          </div>
          <div className="p-6 md:p-8">
            <AIQueryGenerator />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
              <FilterControls
                sortKey={sortKey}
                onSortKeyChange={(key) => setSortKey(key as keyof Employee)}
                sortOrder={sortOrder}
                onSortOrderChange={handleSortOrderToggle}
                departments={uniqueDepartments}
                departmentFilter={departmentFilter}
                onDepartmentFilterChange={setDepartmentFilter}
                positions={uniquePositions}
                positionFilter={positionFilter}
                onPositionFilterChange={setPositionFilter}
                onExport={handleExportCsv}
              />
            </div>
            <EmployeeTable
              employees={processedEmployees}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteRequest}
            />
          </div>
        </div>
      </main>

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setEmployeeModalOpen(false)}
        onSave={handleSaveEmployee}
        employee={selectedEmployee}
      />
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this employee record? This action cannot be undone."
      />
    </div>
  );
}