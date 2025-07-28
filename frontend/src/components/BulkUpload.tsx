import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface BulkUploadProps {
  onUpload: (data: any[]) => Promise<void>;
  templateData: any[];
  templateFilename: string;
  expectedColumns: string[];
  title: string;
  description: string;
}

const BulkUpload: React.FC<BulkUploadProps> = ({
  onUpload,
  templateData,
  templateFilename,
  expectedColumns,
  title,
  description
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      // Read and preview the file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            setError('The file appears to be empty.');
            return;
          }

          // Validate columns
          const fileColumns = Object.keys(jsonData[0] as object);
          const missingColumns = expectedColumns.filter(col => !fileColumns.includes(col));
          
          if (missingColumns.length > 0) {
            setError(`Missing required columns: ${missingColumns.join(', ')}`);
            return;
          }

          setPreview(jsonData.slice(0, 5)); // Show first 5 rows for preview
        } catch (err) {
          setError('Error reading file. Please make sure it\'s a valid Excel file.');
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          await onUpload(jsonData);
          
          // Reset form
          setFile(null);
          setPreview(null);
          const input = document.getElementById('bulk-upload-file') as HTMLInputElement;
          if (input) input.value = '';
        } catch (err: any) {
          setError(err.message || 'Upload failed. Please try again.');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, templateFilename);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>

      {/* Download Template */}
      <div className="mb-6">
        <button
          onClick={downloadTemplate}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
        >
          📄 Download Template
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Download the template Excel file, fill it with your data, then upload it back.
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Excel File
        </label>
        <input
          id="bulk-upload-file"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows):</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {expectedColumns.map(col => (
                    <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index} className="border-b">
                    {expectedColumns.map(col => (
                      <td key={col} className="px-4 py-2 text-sm text-gray-900">
                        {row[col] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Total rows to upload: {preview.length > 0 ? 'Multiple' : 0}
          </p>
        </div>
      )}

      {/* Upload Button */}
      {file && !error && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
        >
          {uploading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Uploading...
            </div>
          ) : (
            `📤 Upload ${title}`
          )}
        </button>
      )}
    </div>
  );
};

export default BulkUpload;
