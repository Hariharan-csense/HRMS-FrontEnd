import React from 'react';
import { PdfExportService } from '@/services/pdfExportService';

const PDFExportTest = () => {
  const pdfService = PdfExportService.getInstance();

  const testSingleExport = async () => {
    const testExpense = {
      id: 'test-123',
      employeeName: 'John Doe',
      category: 'Travel',
      amount: 1500,
      date: '2024-01-15',
      description: 'Business trip to Mumbai for client meeting',
      receipt_url: 'https://via.placeholder.com/300x200',
      company_id: 1
    };

    try {
      await pdfService.exportSingleExpense(testExpense);
      console.log('Single PDF export successful');
    } catch (error) {
      console.error('Single PDF export failed:', error);
    }
  };

  const testMultipleExport = async () => {
    const testExpenses = [
      {
        id: 'test-123',
        employeeName: 'John Doe',
        category: 'Travel',
        amount: 1500,
        date: '2024-01-15',
        description: 'Business trip to Mumbai for client meeting',
        receipt_url: 'https://via.placeholder.com/300x200',
        company_id: 1
      },
      {
        id: 'test-456',
        employeeName: 'Jane Smith',
        category: 'Meals',
        amount: 500,
        date: '2024-01-16',
        description: 'Team lunch at restaurant',
        company_id: 1
      }
    ];

    try {
      await pdfService.exportMultipleExpenses(testExpenses);
      console.log('Multiple PDF export successful');
    } catch (error) {
      console.error('Multiple PDF export failed:', error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">PDF Export Test</h2>
      <div className="space-x-4">
        <button
          onClick={testSingleExport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Single Export
        </button>
        <button
          onClick={testMultipleExport}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Multiple Export
        </button>
      </div>
    </div>
  );
};

export default PDFExportTest;
