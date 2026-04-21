import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  AlertCircle,
  Loader2,
  Upload,
  Pencil,
  Trash2,
  Download,
  FileSpreadsheet,
  FileUp,
  Search
} from 'lucide-react';
import ENDPOINTS from '@/lib/endpoint';
import { isValidEmail, isValidPhone, normalizeEmail } from '@/lib/validation';
import { showToast } from '@/utils/toast';

interface Candidate {
  id: string;
  name: string;
  clientName: string;
  email: string;
  phone: string;
  position: string;
  jobLocation: string;
  age: string;
  gender: string;
  nativePlace: string;
  highestQualification: string;
  department: string;
  experience: string;
  relevantExperience: string;
  currentEmployer: string;
  currentDesignation: string;
  currentLocation: string;
  ctc: string;
  ectc: string;
  expectedSalary: string;
  noticePeriod: string;
  skills: string;
  resumeUrl: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired';
  appliedDate: string;
  notes: string;
  source: string;
}

type CandidateFormData = Omit<Candidate, 'id'>;
type CandidateFieldKey = keyof CandidateFormData;

const createEmptyCandidateForm = (): CandidateFormData => ({
  name: '',
  clientName: '',
  email: '',
  phone: '',
  position: '',
  jobLocation: '',
  age: '',
  gender: '',
  nativePlace: '',
  highestQualification: '',
  department: '',
  experience: '',
  relevantExperience: '',
  currentEmployer: '',
  currentDesignation: '',
  currentLocation: '',
  ctc: '',
  ectc: '',
  expectedSalary: '',
  noticePeriod: '',
  skills: '',
  resumeUrl: '',
  source: '',
  appliedDate: new Date().toISOString().split('T')[0],
  status: 'applied' as const,
  notes: '',
});

const normalizeExcelHeader = (value: string | undefined | null) =>
  String(value ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

const isBlankExcelRow = (row: Record<string, unknown>) =>
  Object.values(row).every((value) => String(value ?? '').trim() === '');

const candidateExcelAliases: Record<CandidateFieldKey, string[]> = {
  name: ['candidate name', 'name', 'full name', 'candidate', 'employee name', 'consultant name', 'applicant name'],
  clientName: ['client name', 'client', 'company name', 'customer name', 'department', 'company', 'client company', 'customer', 'account name'],
  email: ['mail address', 'email', 'email address', 'mail id', 'candidate email', 'personal email', 'primary email', 'email id'],
  phone: ['mobile no', 'mobile', 'phone', 'phone number', 'contact number', 'mobile number', 'candidate phone', 'personal phone', 'contact no', 'whatsapp number', 'whatsapp no'],
  position: ['position', 'designation', 'job title', 'role', 'applied for', 'applied position', 'current role', 'profile'],
  jobLocation: ['job location', 'location', 'job city', 'preferred location', 'work location', 'posting location', 'base location'],
  age: ['age'],
  gender: ['gender', 'sex'],
  nativePlace: ['native', 'native place', 'hometown', 'native location', 'home town'],
  highestQualification: ['highest qualification', 'qualification', 'education', 'highest education', 'academic qualification', 'educational qualification'],
  department: ['department', 'client name', 'client', 'division', 'business unit'],
  experience: ['total exp', 'experience', 'total experience', 'overall experience', 'years of experience', 'work experience'],
  relevantExperience: ['relevant exp', 'relevant experience', 'relevant work experience', 'domain experience'],
  currentEmployer: ['current employer', 'current company', 'employer', 'company', 'present company', 'organization'],
  currentDesignation: ['current designation', 'current role', 'present designation', 'current title'],
  currentLocation: ['current location', 'present location', 'current city', 'present city', 'current place'],
  ctc: ['ctc', 'current ctc', 'current salary', 'present ctc', 'current package'],
  ectc: ['ectc', 'expected ctc', 'expected salary', 'expected package'],
  expectedSalary: ['expected salary', 'expected ctc', 'ectc', 'expected package'],
  noticePeriod: ['notice period', 'notice', 'notice period days', 'joining period', 'availability'],
  skills: ['skills', 'skill set', 'technical skills', 'primary skills', 'core skills', 'key skills'],
  resumeUrl: ['resume url', 'resume link', 'cv link', 'profile link', 'resume', 'cv', 'linkedin profile'],
  status: ['status', 'application status', 'candidate status'],
  appliedDate: ['date of creation', 'applied date', 'date', 'created date', 'application date', 'date created'],
  notes: ['notes', 'remarks', 'comments', 'comment', 'description'],
  source: ['source', 'candidate source', 'reference source', 'portal', 'channel'],
};

const excelDateToISO = (value: unknown): string => {
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  const str = String(value ?? '').trim();
  if (!str) return '';

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return '';
};

const normalizeStatusValue = (value: unknown): CandidateFormData['status'] | '' => {
  const normalized = String(value ?? '').trim().toLowerCase();
  const allowedStatuses: CandidateFormData['status'][] = ['applied', 'screening', 'interview', 'offer', 'rejected', 'hired'];

  return allowedStatuses.includes(normalized as CandidateFormData['status'])
    ? (normalized as CandidateFormData['status'])
    : '';
};

const normalizeGenderValue = (value: unknown): string => {
  const normalized = String(value ?? '').trim().toLowerCase();

  switch (normalized) {
    case 'male':
      return 'Male';
    case 'female':
      return 'Female';
    case 'other':
      return 'Other';
    default:
      return String(value ?? '').trim();
  }
};

const normalizeExcelCellValue = (field: CandidateFieldKey, value: unknown): string => {
  if (value === null || value === undefined) return '';

  if (field === 'appliedDate') {
    return excelDateToISO(value);
  }

  if (field === 'phone') {
    return String(value).replace(/\D/g, '').slice(0, 10);
  }

  if (field === 'status') {
    return normalizeStatusValue(value);
  }

  if (field === 'gender') {
    return normalizeGenderValue(value);
  }

  return String(value).trim();
};

const buildImportSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '')
    .slice(0, 40);

const createImportedName = (rowNumber: number): string =>
  `Imported Candidate ${rowNumber}`;

const createImportedEmail = (name: string, rowNumber: number): string => {
  const base = buildImportSlug(name) || `candidate.${rowNumber}`;
  return `${base}.${rowNumber}@imported.local`;
};

const createImportedPhone = (rowNumber: number): string =>
  `9${String(100000000 + rowNumber).slice(-9)}`;

const appendImportNote = (existingNotes: string, note: string): string => {
  const normalizedExistingNotes = existingNotes.trim();
  if (!note) return normalizedExistingNotes;
  if (!normalizedExistingNotes) return note;
  if (normalizedExistingNotes.includes(note)) return normalizedExistingNotes;
  return `${normalizedExistingNotes} | ${note}`;
};

const mapExcelRowToCandidateForm = (row: Record<string, unknown>): Partial<CandidateFormData> => {
  const normalizedRow = new Map(
    Object.entries(row).map(([key, value]) => [normalizeExcelHeader(key), value])
  );
  const mapped: Partial<CandidateFormData> = {};

  (Object.keys(candidateExcelAliases) as CandidateFieldKey[]).forEach((field) => {
    const matchedHeader = candidateExcelAliases[field].find((alias) =>
      Array.from(normalizedRow.keys()).some((header) => {
        const normalizedAlias = normalizeExcelHeader(alias);
        return (
          header === normalizedAlias ||
          header.includes(normalizedAlias) ||
          normalizedAlias.includes(header)
        );
      })
    );
    if (!matchedHeader) return;

    const normalizedAlias = normalizeExcelHeader(matchedHeader);
    const matchedKey = Array.from(normalizedRow.keys()).find((header) => (
      header === normalizedAlias ||
      header.includes(normalizedAlias) ||
      normalizedAlias.includes(header)
    ));
    if (!matchedKey) return;

    const rawValue = normalizedRow.get(matchedKey);
    const normalizedValue = normalizeExcelCellValue(field, rawValue);
    if (!normalizedValue) return;

    (mapped as Record<CandidateFieldKey, string>)[field] = normalizedValue;
  });

  if (mapped.clientName && !mapped.department) {
    mapped.department = mapped.clientName;
  }

  if (!mapped.name) {
    const firstNameKey = Array.from(normalizedRow.keys()).find((header) =>
      ['first name', 'firstname', 'given name'].includes(header)
    );
    const lastNameKey = Array.from(normalizedRow.keys()).find((header) =>
      ['last name', 'lastname', 'surname', 'family name'].includes(header)
    );

    const firstName = firstNameKey ? String(normalizedRow.get(firstNameKey) ?? '').trim() : '';
    const lastName = lastNameKey ? String(normalizedRow.get(lastNameKey) ?? '').trim() : '';
    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName) {
      mapped.name = fullName;
    }
  }

  if (!mapped.email) {
    const mailKey = Array.from(normalizedRow.keys()).find((header) =>
      ['mail', 'email address', 'candidate email', 'personal email'].some((alias) => header.includes(alias))
    );
    if (mailKey) {
      const emailValue = String(normalizedRow.get(mailKey) ?? '').trim();
      if (emailValue) {
        mapped.email = emailValue;
      }
    }
  }

  if (!mapped.phone) {
    const phoneKey = Array.from(normalizedRow.keys()).find((header) =>
      ['phone', 'mobile', 'contact', 'whatsapp'].some((alias) => header.includes(alias))
    );
    if (phoneKey) {
      const phoneValue = normalizeExcelCellValue('phone', normalizedRow.get(phoneKey));
      if (phoneValue) {
        mapped.phone = phoneValue;
      }
    }
  }

  if (mapped.ectc && !mapped.expectedSalary) {
    mapped.expectedSalary = mapped.ectc;
  }

  return mapped;
};

const prepareImportedCandidateData = (mappedData: Partial<CandidateFormData>): CandidateFormData => ({
  ...createEmptyCandidateForm(),
  ...mappedData,
  clientName: mappedData.clientName ?? '',
  department: mappedData.department ?? mappedData.clientName ?? '',
  expectedSalary: mappedData.expectedSalary ?? mappedData.ectc ?? '',
  appliedDate: mappedData.appliedDate || new Date().toISOString().split('T')[0],
  status: mappedData.status || 'applied',
});

const finalizeImportedCandidateRow = (
  row: CandidateFormData,
  rowNumber: number
): CandidateFormData => {
  const finalizedRow = { ...row };

  if (!finalizedRow.name) {
    finalizedRow.name = createImportedName(rowNumber);
    finalizedRow.notes = appendImportNote(finalizedRow.notes, 'Original sheet had no candidate name');
  }

  if (!finalizedRow.email) {
    finalizedRow.email = createImportedEmail(finalizedRow.name, rowNumber);
    finalizedRow.notes = appendImportNote(finalizedRow.notes, 'Original sheet had no email');
  }

  if (!finalizedRow.phone) {
    finalizedRow.phone = createImportedPhone(rowNumber);
    finalizedRow.notes = appendImportNote(finalizedRow.notes, 'Original sheet had no phone');
  }

  return finalizedRow;
};

const HRRecruitment: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingCandidate, setDeletingCandidate] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [excelFileName, setExcelFileName] = useState('');
  const lastCompletedRequestKeyRef = useRef<string | null>(null);
  const activeRequestKeyRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState(createEmptyCandidateForm);

  const fetchCandidates = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
    const params: any = {};
    if (statusFilter && statusFilter !== 'all') {
      params.status = statusFilter;
    }
    if (searchTerm) {
      params.search = searchTerm;
    }

    const requestKey = JSON.stringify(params);
    if (!force) {
      if (activeRequestKeyRef.current === requestKey) {
        return;
      }

      if (lastCompletedRequestKeyRef.current === requestKey) {
        return;
      }
    }

    try {
      activeRequestKeyRef.current = requestKey;
      setLoading(true);
      setError(null);
      const result = await ENDPOINTS.fetchCandidates(params);
      if (result.data) {
        lastCompletedRequestKeyRef.current = requestKey;
        setCandidates(result.data.map((candidate: any) => ({
          id: candidate.id,
          name: candidate.name,
          clientName: candidate.client_name || candidate.department || '',
          email: candidate.email,
          phone: candidate.phone,
          position: candidate.position,
          jobLocation: candidate.job_location || '',
          age: candidate.age ? String(candidate.age) : '',
          gender: candidate.gender || '',
          nativePlace: candidate.native_place || '',
          highestQualification: candidate.highest_qualification || '',
          department: candidate.department,
          experience: candidate.experience,
          relevantExperience: candidate.relevant_experience || '',
          status: candidate.status,
          appliedDate: candidate.applied_date ? new Date(candidate.applied_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          source: candidate.source || '',
          currentEmployer: candidate.current_company || '',
          currentDesignation: candidate.current_designation || '',
          currentLocation: candidate.current_location || '',
          ctc: candidate.ctc || '',
          ectc: candidate.ectc || candidate.expected_salary || '',
          expectedSalary: candidate.expected_salary || '',
          noticePeriod: candidate.notice_period || '',
          skills: candidate.skills || '',
          resumeUrl: candidate.resume_url || '',
          notes: candidate.notes || ''
        })));
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch candidates');
    } finally {
      if (activeRequestKeyRef.current === requestKey) {
        activeRequestKeyRef.current = null;
      }
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const delay = searchTerm || statusFilter !== 'all' ? 500 : 0;
    const timer = window.setTimeout(() => {
      fetchCandidates();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [fetchCandidates, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-gray-100 text-gray-800';
      case 'screening': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-yellow-100 text-yellow-800';
      case 'offer': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setError('Phone number must be 10 digits and start with 6, 7, 8, or 9');
      return;
    }

    try {
      setSubmitting(true);
      const result = await ENDPOINTS.addCandidate({
        ...formData,
        email: normalizeEmail(formData.email),
        phone: formData.phone.trim(),
      });
      if (result.data) {
        // Refresh the candidate list from server to get the latest data
        await fetchCandidates({ force: true });
        setFormData(createEmptyCandidateForm());
        setExcelFileName('');
        setIsDialogOpen(false);
      } else {
        setError(result.error || 'Failed to create candidate');
      }
    } catch (err) {
      setError('Failed to create candidate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setError(null);

    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setError('Phone number must be 10 digits and start with 6, 7, 8, or 9');
      return;
    }

    try {
      setSubmitting(true);
      const result = await ENDPOINTS.editCandidate(selectedCandidate.id, {
        ...formData,
        email: normalizeEmail(formData.email),
        phone: formData.phone.trim(),
      });
      if (result.data) {
        // Refresh the candidate list from server to get the latest data
        await fetchCandidates({ force: true });
        setFormData(createEmptyCandidateForm());
        setExcelFileName('');
        setIsEditDialogOpen(false);
        setSelectedCandidate(null);
      } else {
        setError(result.error || 'Failed to update candidate');
      }
    } catch (err) {
      setError('Failed to update candidate');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setFormData({
      name: candidate.name,
      clientName: candidate.clientName,
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.position,
      jobLocation: candidate.jobLocation,
      age: candidate.age,
      gender: candidate.gender,
      nativePlace: candidate.nativePlace,
      highestQualification: candidate.highestQualification,
      department: candidate.department,
      experience: candidate.experience,
      relevantExperience: candidate.relevantExperience,
      currentEmployer: candidate.currentEmployer,
      currentDesignation: candidate.currentDesignation,
      currentLocation: candidate.currentLocation,
      ctc: candidate.ctc,
      ectc: candidate.ectc,
      expectedSalary: candidate.expectedSalary,
      noticePeriod: candidate.noticePeriod,
      skills: candidate.skills,
      resumeUrl: candidate.resumeUrl,
      source: candidate.source,
      appliedDate: candidate.appliedDate,
      status: candidate.status,
      notes: candidate.notes,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!candidateToDelete) return;

    try {
      setDeletingCandidate(true);
      setError(null);
      const result = await ENDPOINTS.removeCandidate(candidateToDelete.id);
      if (result.success) {
        await fetchCandidates({ force: true });
        if (selectedCandidate?.id === candidateToDelete.id) {
          setIsEditDialogOpen(false);
          setSelectedCandidate(null);
          setFormData(createEmptyCandidateForm());
        }
        showToast.success(`Candidate "${candidateToDelete.name}" deleted successfully`);
        setIsDeleteDialogOpen(false);
        setCandidateToDelete(null);
        return;
      }

      const message = result.error || 'Failed to delete candidate';
      setError(message);
      showToast.error(message);
    } catch (err) {
      const message = 'Failed to delete candidate';
      setError(message);
      showToast.error(message);
    } finally {
      setDeletingCandidate(false);
    }
  };

  const importCandidatesFromRows = async (rows: CandidateFormData[], fileName: string) => {
    const failures: string[] = [];
    const importPayload: Array<CandidateFormData & { rowNumber: number }> = [];

    setImportingExcel(true);
    setError(null);

    try {
      for (const [index, row] of rows.entries()) {
        const displayRowNumber = index + 2;
        const importReadyRow = finalizeImportedCandidateRow(row, displayRowNumber);

        if (!importReadyRow.name || !importReadyRow.email || !importReadyRow.phone) {
          const missingFields = [
            !importReadyRow.name ? 'name' : '',
            !importReadyRow.email ? 'email' : '',
            !importReadyRow.phone ? 'phone' : '',
          ].filter(Boolean).join(', ');
          failures.push(`Row ${displayRowNumber}: missing ${missingFields}`);
          continue;
        }

        if (!isValidEmail(importReadyRow.email)) {
          failures.push(`Row ${displayRowNumber}: invalid email`);
          continue;
        }

        if (!isValidPhone(importReadyRow.phone)) {
          failures.push(`Row ${displayRowNumber}: invalid mobile number`);
          continue;
        }

        importPayload.push({
          ...importReadyRow,
          rowNumber: displayRowNumber,
          email: normalizeEmail(importReadyRow.email),
          phone: importReadyRow.phone.trim(),
        });
      }

      let successCount = 0;
      if (importPayload.length > 0) {
        const result = await ENDPOINTS.addCandidatesBulk(importPayload);
        if (result.data) {
          successCount = result.data.inserted || 0;
          failures.push(...(result.data.failures || []));
          await fetchCandidates({ force: true });
        } else {
          const bulkError = result.error || 'failed to import candidates';
          setError(bulkError);
          showToast.error(bulkError);
          return;
        }
      }

      setExcelFileName(fileName);

      if (successCount > 0 && failures.length === 0) {
        showToast.success(`${successCount} candidate${successCount > 1 ? 's' : ''} imported successfully`);
        setIsDialogOpen(false);
        setFormData(createEmptyCandidateForm());
        return;
      }

      if (successCount > 0) {
        const summary = `${successCount} imported, ${failures.length} failed`;
        setError(`${summary}. ${failures.slice(0, 3).join(' | ')}`);
        showToast.success(summary);
        return;
      }

      const failureMessage = failures.slice(0, 3).join(' | ') || 'No valid candidate rows found in Excel';
      setError(failureMessage);
      showToast.error(failureMessage);
    } finally {
      setImportingExcel(false);
    }
  };

  const handleCandidateExcelUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    mode: 'page' | 'form' = 'page'
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xls') && !lowerName.endsWith('.xlsx')) {
      setError('Please upload a valid Excel file (.xls or .xlsx)');
      return;
    }

    try {
      setError(null);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      if (!worksheet) {
        throw new Error('No worksheet found in the uploaded Excel file');
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: '',
      });

      if (!rows.length) {
        throw new Error('Excel file is empty');
      }

      const mappedRows = rows
        .filter((row) => !isBlankExcelRow(row))
        .map((row) => mapExcelRowToCandidateForm(row))
        .filter((row) => Object.keys(row).length > 0)
        .map((row) => prepareImportedCandidateData(row));

      if (!mappedRows.length) {
        throw new Error('No matching candidate columns found in the Excel file');
      }

      setExcelFileName(file.name);

      if (mode === 'form' && mappedRows.length === 1) {
        const mappedData = finalizeImportedCandidateRow(mappedRows[0], 2);
        setFormData((prev) => ({
          ...prev,
          ...mappedData,
          clientName: mappedData.clientName ?? prev.clientName,
          department: mappedData.department ?? mappedData.clientName ?? prev.department,
          expectedSalary: mappedData.expectedSalary ?? mappedData.ectc ?? prev.expectedSalary,
        }));
        setIsDialogOpen(true);
        showToast.success('Candidate data imported from Excel');
        return;
      }

      await importCandidatesFromRows(mappedRows, file.name);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Failed to import Excel file';
      setError(message);
      showToast.error(message);
    }
  };

  // Export all candidates to Excel
  const handleExportToExcel = () => {
    if (candidates.length === 0) {
      showToast.error('No candidates to export');
      return;
    }

    const exportData = candidates.map(candidate => ({
      'Date of Creation': candidate.appliedDate || '',
      'Client Name': candidate.clientName || '',
      'Position': candidate.position || '',
      'Job Location': candidate.jobLocation || '',
      'Candidate Name': candidate.name || '',
      'Age': candidate.age || '',
      'Gender': candidate.gender || '',
      'Native': candidate.nativePlace || '',
      'Mobile No': candidate.phone || '',
      'Mail Address': candidate.email || '',
      'Highest Qualification': candidate.highestQualification || '',
      'Total Exp': candidate.experience || '',
      'Relevant Exp': candidate.relevantExperience || '',
      'Current Employer': candidate.currentEmployer || '',
      'Current Designation': candidate.currentDesignation || '',
      'Current Location': candidate.currentLocation || '',
      'CTC': candidate.ctc || '',
      'ECTC': candidate.ectc || '',
      'Notice Period': candidate.noticePeriod || '',
      'Interview Remarks / Notes': candidate.notes || '',
      'Status': candidate.status || '',
      'Skills': candidate.skills || '',
      'Source': candidate.source || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    XLSX.writeFile(wb, `Candidates_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast.success(`Exported ${candidates.length} candidates to Excel`);
  };

  // Download empty template with headers only
  const handleDownloadTemplate = () => {
    const templateData = [{
      'Date of Creation': '',
      'Client Name': '',
      'Position': '',
      'Job Location': '',
      'Candidate Name': '',
      'Age': '',
      'Gender': '',
      'Native': '',
      'Mobile No': '',
      'Mail Address': '',
      'Highest Qualification': '',
      'Total Exp': '',
      'Relevant Exp': '',
      'Current Employer': '',
      'Current Designation': '',
      'Current Location': '',
      'CTC': '',
      'ECTC': '',
      'Notice Period': '',
      'Interview Remarks / Notes': '',
      'Status': 'applied',
      'Skills': '',
      'Source': ''
    }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidate Template');
    XLSX.writeFile(wb, 'Candidate_Import_Template.xlsx');
    showToast.success('Template downloaded successfully');
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = (candidate.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (candidate.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (candidate.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (candidate.position?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">Recruitment Management</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">Manage job applications and recruitment process</p>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '-' : candidates.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setFormData(createEmptyCandidateForm());
                  setExcelFileName('');
                  setError(null);
                  setIsDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Candidate
              </Button>
              <Button
                variant="outline"
                onClick={handleExportToExcel}
                className="gap-2"
                disabled={candidates.length === 0}
              >
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Template
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <FileUp className="w-4 h-4" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => handleCandidateExcelUpload(event, 'page')}
                disabled={importingExcel}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Candidates</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search candidates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading candidates...</span>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No candidates found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="sm:hidden space-y-4">
                  {filteredCandidates.map((candidate) => (
                    <Card key={candidate.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-base">{candidate.name}</h3>
                            <p className="text-sm text-gray-500">{candidate.clientName}</p>
                            <p className="text-sm text-gray-600 mt-1">{candidate.position}</p>
                            <p className="text-xs text-gray-500">{candidate.email}</p>
                          </div>
                          <Badge className={`${getStatusColor(candidate.status)} px-2 py-1 text-xs font-medium rounded-full capitalize`}>
                            {candidate.status}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Job Location</span>
                            <span className="text-sm text-gray-900">{candidate.jobLocation || '-'}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Exp</span>
                            <span className="text-sm text-gray-900">{candidate.experience}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Applied</span>
                            <span className="text-sm text-gray-900">{candidate.appliedDate}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">ECTC</span>
                            <span className="text-sm text-gray-900">{candidate.ectc || '-'}</span>
                          </div>

                          <div className="flex justify-end space-x-2 pt-2 border-t">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                openEditDialog(candidate);
                              }}
                              className="h-8 px-3"
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleDelete(candidate);
                              }}
                              className="h-8 px-3 text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table className="min-w-[2200px]">
                    <TableHeader>
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="min-w-[120px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Creation</TableHead>
                        <TableHead className="min-w-[140px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</TableHead>
                        <TableHead className="min-w-[140px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</TableHead>
                        <TableHead className="min-w-[140px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Location</TableHead>
                        <TableHead className="min-w-[160px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate Name</TableHead>
                        <TableHead className="min-w-[80px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</TableHead>
                        <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</TableHead>
                        <TableHead className="min-w-[120px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Native</TableHead>
                        <TableHead className="min-w-[130px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile No</TableHead>
                        <TableHead className="min-w-[180px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mail Address</TableHead>
                        <TableHead className="min-w-[160px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Highest Qualification</TableHead>
                        <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Exp</TableHead>
                        <TableHead className="min-w-[120px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relevant Exp</TableHead>
                        <TableHead className="min-w-[160px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Employer</TableHead>
                        <TableHead className="min-w-[160px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Designation</TableHead>
                        <TableHead className="min-w-[140px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Location</TableHead>
                        <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTC</TableHead>
                        <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ECTC</TableHead>
                        <TableHead className="min-w-[120px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notice Period</TableHead>
                        <TableHead className="min-w-[180px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interview Remarks / Notes</TableHead>
                        <TableHead className="min-w-[100px] py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white divide-y divide-gray-200">
                      {filteredCandidates.map((candidate) => (
                        <TableRow key={candidate.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.appliedDate}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.clientName || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.position || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.jobLocation || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{candidate.name}</div>
                              <div className="text-xs sm:text-sm text-gray-500 mt-1">{candidate.email}</div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  openEditDialog(candidate);
                                }}
                                className="mt-2 h-7 w-7 p-0 text-blue-700 hover:text-blue-800"
                                aria-label={`Edit ${candidate.name}`}
                                title="Edit candidate"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleDelete(candidate);
                                }}
                                className="mt-2 ml-1 h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                aria-label={`Delete ${candidate.name}`}
                                title="Delete candidate"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.age || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.gender || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.nativePlace || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.phone || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.email || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.highestQualification || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.experience || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.relevantExperience || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.currentEmployer || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.currentDesignation || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.currentLocation || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.ctc || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.ectc || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="text-sm text-gray-900">{candidate.noticePeriod || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="max-w-[240px] truncate text-sm text-gray-900" title={candidate.notes || '-'}>
                              {candidate.notes || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 sm:py-4 px-2 sm:px-4">
                            <Badge className={`${getStatusColor(candidate.status)} px-2 py-1 text-xs font-medium rounded-full capitalize`}>
                              {candidate.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[98vw] sm:w-[95vw] max-w-5xl max-h-[95vh] overflow-y-auto mx-auto p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Upload Candidate Excel</p>

                    {excelFileName && (
                      <p className="mt-1 text-xs text-blue-700">Imported file: {excelFileName}</p>
                    )}
                  </div>
                  <div className="w-full sm:w-auto">
                    <Label
                      htmlFor="candidate-excel-upload"
                      className={`inline-flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition sm:w-auto ${importingExcel
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                        : 'cursor-pointer border-blue-200 bg-white text-blue-700 hover:bg-blue-100'
                        }`}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {importingExcel ? 'Importing...' : 'Upload Excel'}
                    </Label>
                    <input
                      id="candidate-excel-upload"
                      type="file"
                      accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={(event) => handleCandidateExcelUpload(event, 'form')}
                      disabled={importingExcel}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">RMS Candidate Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="appliedDate">Date of Creation</Label>
                    <Input
                      id="appliedDate"
                      type="date"
                      value={formData.appliedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, appliedDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value, department: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobLocation">Job Location</Label>
                    <Input
                      id="jobLocation"
                      value={formData.jobLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, jobLocation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Candidate Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Mail Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Mobile No</Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="0"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nativePlace">Native</Label>
                    <Input
                      id="nativePlace"
                      value={formData.nativePlace}
                      onChange={(e) => setFormData(prev => ({ ...prev, nativePlace: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="highestQualification">Highest Qualification</Label>
                    <Input
                      id="highestQualification"
                      value={formData.highestQualification}
                      onChange={(e) => setFormData(prev => ({ ...prev, highestQualification: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Total Exp</Label>
                    <Input
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="e.g., 5 Years"
                    />
                  </div>
                  <div>
                    <Label htmlFor="relevantExperience">Relevant Exp</Label>
                    <Input
                      id="relevantExperience"
                      value={formData.relevantExperience}
                      onChange={(e) => setFormData(prev => ({ ...prev, relevantExperience: e.target.value }))}
                      placeholder="e.g., 3 Years"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Current Employment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="currentEmployer">Current Employer</Label>
                    <Input
                      id="currentEmployer"
                      value={formData.currentEmployer}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentEmployer: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentDesignation">Current Designation</Label>
                    <Input
                      id="currentDesignation"
                      value={formData.currentDesignation}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentDesignation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentLocation">Current Location</Label>
                    <Input
                      id="currentLocation"
                      value={formData.currentLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentLocation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ctc">CTC</Label>
                    <Input
                      id="ctc"
                      value={formData.ctc}
                      onChange={(e) => setFormData(prev => ({ ...prev, ctc: e.target.value }))}
                      placeholder="e.g., 4.5 LPA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ectc">ECTC</Label>
                    <Input
                      id="ectc"
                      value={formData.ectc}
                      onChange={(e) => setFormData(prev => ({ ...prev, ectc: e.target.value, expectedSalary: e.target.value }))}
                      placeholder="e.g., 6 LPA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="noticePeriod">Notice Period</Label>
                    <Input
                      id="noticePeriod"
                      value={formData.noticePeriod}
                      onChange={(e) => setFormData(prev => ({ ...prev, noticePeriod: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      placeholder="e.g., LinkedIn, Indeed, Referral"
                    />
                  </div>
                  <div>
                    <Label htmlFor="resumeUrl">Resume URL</Label>
                    <Input
                      id="resumeUrl"
                      value={formData.resumeUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, resumeUrl: e.target.value }))}
                      placeholder="Link to resume or portfolio"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Label htmlFor="skills">Skills</Label>
                    <textarea
                      id="skills"
                      value={formData.skills}
                      onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                      placeholder="List key skills separated by commas"
                      className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Interview remarks / notes"
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Candidate...
                    </>
                  ) : (
                    'Add Candidate'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Candidate Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={() => setIsEditDialogOpen(false)}>
          <DialogContent className="w-[98vw] sm:w-[95vw] max-w-5xl max-h-[95vh] overflow-y-auto mx-auto p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle>Edit Candidate - {selectedCandidate?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">RMS Candidate Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="edit-appliedDate">Date of Creation</Label>
                    <Input
                      id="edit-appliedDate"
                      type="date"
                      value={formData.appliedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, appliedDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-clientName">Client Name</Label>
                    <Input
                      id="edit-clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value, department: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-position">Position</Label>
                    <Input
                      id="edit-position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-jobLocation">Job Location</Label>
                    <Input
                      id="edit-jobLocation"
                      value={formData.jobLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, jobLocation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-name">Candidate Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-age">Age</Label>
                    <Input
                      id="edit-age"
                      type="number"
                      min="0"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-nativePlace">Native</Label>
                    <Input
                      id="edit-nativePlace"
                      value={formData.nativePlace}
                      onChange={(e) => setFormData(prev => ({ ...prev, nativePlace: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Mobile No</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Mail Address</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-highestQualification">Highest Qualification</Label>
                    <Input
                      id="edit-highestQualification"
                      value={formData.highestQualification}
                      onChange={(e) => setFormData(prev => ({ ...prev, highestQualification: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-experience">Total Exp</Label>
                    <Input
                      id="edit-experience"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-relevantExperience">Relevant Exp</Label>
                    <Input
                      id="edit-relevantExperience"
                      value={formData.relevantExperience}
                      onChange={(e) => setFormData(prev => ({ ...prev, relevantExperience: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Status</h3>
                <div>
                  <Label htmlFor="edit-status">Application Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="screening">Screening</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Current Employment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="edit-currentEmployer">Current Employer</Label>
                    <Input
                      id="edit-currentEmployer"
                      value={formData.currentEmployer}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentEmployer: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-currentDesignation">Current Designation</Label>
                    <Input
                      id="edit-currentDesignation"
                      value={formData.currentDesignation}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentDesignation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-currentLocation">Current Location</Label>
                    <Input
                      id="edit-currentLocation"
                      value={formData.currentLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentLocation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-ctc">CTC</Label>
                    <Input
                      id="edit-ctc"
                      value={formData.ctc}
                      onChange={(e) => setFormData(prev => ({ ...prev, ctc: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-ectc">ECTC</Label>
                    <Input
                      id="edit-ectc"
                      value={formData.ectc}
                      onChange={(e) => setFormData(prev => ({ ...prev, ectc: e.target.value, expectedSalary: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-noticePeriod">Notice Period</Label>
                    <Input
                      id="edit-noticePeriod"
                      value={formData.noticePeriod}
                      onChange={(e) => setFormData(prev => ({ ...prev, noticePeriod: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="edit-source">Source</Label>
                    <Input
                      id="edit-source"
                      value={formData.source}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      placeholder="e.g., LinkedIn, Indeed, Referral"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-resumeUrl">Resume URL</Label>
                    <Input
                      id="edit-resumeUrl"
                      value={formData.resumeUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, resumeUrl: e.target.value }))}
                      placeholder="Link to resume or portfolio"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Label htmlFor="edit-skills">Skills</Label>
                    <textarea
                      id="edit-skills"
                      value={formData.skills}
                      onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                      placeholder="List key skills separated by commas"
                      className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Interview remarks / notes"
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (selectedCandidate) {
                      handleDelete(selectedCandidate);
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete Candidate
                </Button>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating Candidate...
                      </>
                    ) : (
                      'Update Candidate'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open && !deletingCandidate) {
              setCandidateToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
              <AlertDialogDescription>
                {candidateToDelete
                  ? `Are you sure you want to delete candidate "${candidateToDelete.name}"? This action cannot be undone.`
                  : 'Are you sure you want to delete this candidate? This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel disabled={deletingCandidate}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deletingCandidate}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingCandidate ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default HRRecruitment;
