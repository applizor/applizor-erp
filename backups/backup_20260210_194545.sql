--
-- PostgreSQL database dump
--

\restrict 7FHeYthiCq8iTBQH3creHSUJhHo9pSVPVIv0IefbigGYfQRF8Cc98Mn6J1FwDBd

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: applizor
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO applizor;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: applizor
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "parentId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Account" OWNER TO applizor;

--
-- Name: Asset; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "serialNumber" text,
    status text DEFAULT 'Available'::text NOT NULL,
    "purchaseDate" timestamp(3) without time zone,
    price double precision,
    "employeeId" text,
    "assignedDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL
);


ALTER TABLE public."Asset" OWNER TO applizor;

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    date date NOT NULL,
    "checkIn" timestamp(3) without time zone,
    "checkOut" timestamp(3) without time zone,
    status text DEFAULT 'present'::text NOT NULL,
    "ipAddress" text,
    location text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Attendance" OWNER TO applizor;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "companyId" text,
    "userId" text,
    action text NOT NULL,
    module text NOT NULL,
    "entityType" text,
    "entityId" text,
    details text,
    changes jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO applizor;

--
-- Name: AutomationRule; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."AutomationRule" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    name text NOT NULL,
    "triggerType" text NOT NULL,
    "triggerConfig" jsonb NOT NULL,
    "actionType" text NOT NULL,
    "actionConfig" jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AutomationRule" OWNER TO applizor;

--
-- Name: Branch; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Branch" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    code text,
    address text,
    city text,
    state text,
    country text DEFAULT 'India'::text NOT NULL,
    pincode text,
    phone text,
    email text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Branch" OWNER TO applizor;

--
-- Name: Candidate; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Candidate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "jobOpeningId" text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    phone text,
    "resumePath" text,
    status text DEFAULT 'applied'::text NOT NULL,
    "currentStage" text,
    notes text,
    rating double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Candidate" OWNER TO applizor;

--
-- Name: Client; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Client" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    city text,
    state text,
    country text DEFAULT 'India'::text NOT NULL,
    pincode text,
    gstin text,
    pan text,
    status text DEFAULT 'active'::text NOT NULL,
    "clientType" text DEFAULT 'customer'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    password text,
    "portalAccess" boolean DEFAULT false NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "createdById" text,
    notes text,
    "shippingAddress" text,
    "taxName" text,
    website text,
    "categoryId" text,
    "companyLogo" text,
    gender text,
    language text DEFAULT 'English'::text,
    mobile text,
    "profilePicture" text,
    "receiveNotifications" boolean DEFAULT true NOT NULL,
    salutation text,
    "subCategoryId" text,
    "companyName" text,
    currency text DEFAULT 'INR'::text NOT NULL,
    tan text
);


ALTER TABLE public."Client" OWNER TO applizor;

--
-- Name: ClientCategory; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."ClientCategory" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClientCategory" OWNER TO applizor;

--
-- Name: ClientSubCategory; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."ClientSubCategory" (
    id text NOT NULL,
    "categoryId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClientSubCategory" OWNER TO applizor;

--
-- Name: Company; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Company" (
    id text NOT NULL,
    name text NOT NULL,
    "legalName" text,
    email text,
    phone text,
    address text,
    city text,
    state text,
    country text DEFAULT 'India'::text NOT NULL,
    pincode text,
    gstin text,
    pan text,
    logo text,
    "letterheadDoc" text,
    "allowedIPs" text,
    latitude double precision,
    longitude double precision,
    radius integer DEFAULT 100 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "enabledModules" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    tan text,
    "continuationSheet" text,
    "digitalSignature" text,
    letterhead text,
    "pdfContinuationTop" integer DEFAULT 80 NOT NULL,
    "pdfMarginBottom" integer DEFAULT 80 NOT NULL,
    "pdfMarginLeft" integer DEFAULT 40 NOT NULL,
    "pdfMarginRight" integer DEFAULT 40 NOT NULL,
    "pdfMarginTop" integer DEFAULT 180 NOT NULL,
    "bankAccountName" text,
    "bankAccountNumber" text,
    "bankBranch" text,
    "bankIfscCode" text,
    "bankName" text
);


ALTER TABLE public."Company" OWNER TO applizor;

--
-- Name: Contract; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Contract" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text NOT NULL,
    "projectId" text,
    "creatorId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "validFrom" date,
    "validUntil" date,
    "sentAt" timestamp(3) without time zone,
    "signedAt" timestamp(3) without time zone,
    "clientSignature" text,
    "signerName" text,
    "signerIp" text,
    "companySignature" text,
    "companySignerId" text,
    "companySignedAt" timestamp(3) without time zone,
    "pdfPath" text,
    "templateId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "lastViewedAt" timestamp(3) without time zone,
    "emailOpens" integer DEFAULT 0 NOT NULL,
    "lastEmailOpenedAt" timestamp(3) without time zone,
    "contractType" text,
    "contractValue" numeric(12,2) DEFAULT 0,
    currency text DEFAULT 'INR'::text NOT NULL
);


ALTER TABLE public."Contract" OWNER TO applizor;

--
-- Name: ContractActivity; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."ContractActivity" (
    id text NOT NULL,
    "contractId" text NOT NULL,
    type text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    location text,
    "deviceType" text,
    browser text,
    os text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ContractActivity" OWNER TO applizor;

--
-- Name: ContractTemplate; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."ContractTemplate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    content text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ContractTemplate" OWNER TO applizor;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Department" OWNER TO applizor;

--
-- Name: Document; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    "companyId" text,
    "clientId" text,
    "invoiceId" text,
    "employeeId" text,
    "projectId" text,
    name text NOT NULL,
    type text NOT NULL,
    category text,
    "filePath" text NOT NULL,
    "fileSize" integer,
    "mimeType" text,
    version integer DEFAULT 1 NOT NULL,
    "isTemplate" boolean DEFAULT false NOT NULL,
    tags text[],
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "taskId" text,
    "rejectionReason" text,
    "signedFilePath" text,
    status text DEFAULT 'approved'::text NOT NULL,
    "uploadedById" text,
    "workflowType" text DEFAULT 'standard'::text
);


ALTER TABLE public."Document" OWNER TO applizor;

--
-- Name: DocumentTemplate; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."DocumentTemplate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "filePath" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    content text,
    variables text[]
);


ALTER TABLE public."DocumentTemplate" OWNER TO applizor;

--
-- Name: EmailTemplate; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."EmailTemplate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    type text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmailTemplate" OWNER TO applizor;

--
-- Name: Employee; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Employee" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "userId" text,
    "employeeId" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    phone text,
    gender text,
    "bloodGroup" text,
    "maritalStatus" text,
    "dateOfBirth" timestamp(3) without time zone,
    "dateOfJoining" timestamp(3) without time zone NOT NULL,
    "currentAddress" text,
    "permanentAddress" text,
    "emergencyContact" jsonb,
    "bankName" text,
    "accountNumber" text,
    "ifscCode" text,
    "panNumber" text,
    "aadhaarNumber" text,
    "departmentId" text,
    "positionId" text,
    "shiftId" text,
    salary numeric(12,2),
    "salaryStructure" jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "employmentType" text,
    "hourlyRate" numeric(10,2),
    "noticePeriodEndDate" timestamp(3) without time zone,
    "noticePeriodStartDate" timestamp(3) without time zone,
    "probationEndDate" timestamp(3) without time zone,
    skills jsonb,
    "slackMemberId" text,
    "probationProcessed" boolean DEFAULT false NOT NULL,
    "candidateId" text
);


ALTER TABLE public."Employee" OWNER TO applizor;

--
-- Name: EmployeeLeaveBalance; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."EmployeeLeaveBalance" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "leaveTypeId" text NOT NULL,
    year integer NOT NULL,
    allocated double precision DEFAULT 0 NOT NULL,
    "carriedOver" double precision DEFAULT 0 NOT NULL,
    used double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmployeeLeaveBalance" OWNER TO applizor;

--
-- Name: EmployeeSalaryComponent; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."EmployeeSalaryComponent" (
    id text NOT NULL,
    "structureId" text NOT NULL,
    "componentId" text NOT NULL,
    "monthlyAmount" numeric(12,2) NOT NULL
);


ALTER TABLE public."EmployeeSalaryComponent" OWNER TO applizor;

--
-- Name: EmployeeSalaryStructure; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."EmployeeSalaryStructure" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "netSalary" numeric(12,2) NOT NULL,
    ctc numeric(12,2) NOT NULL,
    "effectiveDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmployeeSalaryStructure" OWNER TO applizor;

--
-- Name: Estimate; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Estimate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "leadId" text,
    title text NOT NULL,
    description text,
    "estimatedValue" numeric(12,2) NOT NULL,
    timeframe text,
    status text DEFAULT 'draft'::text NOT NULL,
    "convertedToQuotationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Estimate" OWNER TO applizor;

--
-- Name: Holiday; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Holiday" (
    id text NOT NULL,
    name text NOT NULL,
    date date NOT NULL,
    type text DEFAULT 'national'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Holiday" OWNER TO applizor;

--
-- Name: Interview; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Interview" (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    round integer NOT NULL,
    type text NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    interviewer text,
    feedback text,
    rating integer,
    status text DEFAULT 'scheduled'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "meetingLink" text
);


ALTER TABLE public."Interview" OWNER TO applizor;

--
-- Name: InterviewScorecard; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."InterviewScorecard" (
    id text NOT NULL,
    "interviewId" text NOT NULL,
    technical integer DEFAULT 0 NOT NULL,
    communication integer DEFAULT 0 NOT NULL,
    "problemSolving" integer DEFAULT 0 NOT NULL,
    "cultureFit" integer DEFAULT 0 NOT NULL,
    comments text,
    "submittedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    recommendation text
);


ALTER TABLE public."InterviewScorecard" OWNER TO applizor;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text NOT NULL,
    "invoiceNumber" text NOT NULL,
    "invoiceDate" date NOT NULL,
    "dueDate" date NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    type text DEFAULT 'invoice'::text NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    terms text,
    subtotal numeric(12,2) NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    "paidAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "isRecurring" boolean DEFAULT false NOT NULL,
    "recurringId" text,
    notes text,
    "pdfPath" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "nextOccurrence" timestamp(3) without time zone,
    "projectId" text,
    "recurringInterval" text,
    "recurringEndDate" date,
    "recurringNextRun" date,
    "recurringStartDate" date,
    "recurringStatus" text DEFAULT 'active'::text NOT NULL,
    "emailOpens" integer DEFAULT 0 NOT NULL,
    "isPublicEnabled" boolean DEFAULT false NOT NULL,
    "lastEmailOpenedAt" timestamp(3) without time zone,
    "lastViewedAt" timestamp(3) without time zone,
    "publicExpiresAt" timestamp(3) without time zone,
    "publicToken" text,
    "viewCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO applizor;

--
-- Name: InvoiceActivity; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."InvoiceActivity" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    type text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    location text,
    "deviceType" text,
    browser text,
    os text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."InvoiceActivity" OWNER TO applizor;

--
-- Name: InvoiceItem; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."InvoiceItem" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    rate numeric(12,2) NOT NULL,
    "taxRate" numeric(5,2) DEFAULT 0 NOT NULL,
    amount numeric(12,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "taxRateId" text,
    unit text,
    discount numeric(5,2) DEFAULT 0 NOT NULL,
    "hsnSacCode" text
);


ALTER TABLE public."InvoiceItem" OWNER TO applizor;

--
-- Name: InvoiceItemTax; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."InvoiceItemTax" (
    id text NOT NULL,
    "invoiceItemId" text NOT NULL,
    "taxRateId" text NOT NULL,
    name text NOT NULL,
    percentage numeric(5,2) NOT NULL,
    amount numeric(12,2) NOT NULL
);


ALTER TABLE public."InvoiceItemTax" OWNER TO applizor;

--
-- Name: JobOpening; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."JobOpening" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    title text NOT NULL,
    department text,
    "position" text,
    description text,
    requirements text,
    status text DEFAULT 'open'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."JobOpening" OWNER TO applizor;

--
-- Name: JournalEntry; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."JournalEntry" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    date date NOT NULL,
    reference text,
    description text,
    status text DEFAULT 'draft'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."JournalEntry" OWNER TO applizor;

--
-- Name: JournalEntryLine; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."JournalEntryLine" (
    id text NOT NULL,
    "journalEntryId" text NOT NULL,
    "accountId" text NOT NULL,
    debit numeric(15,2) DEFAULT 0 NOT NULL,
    credit numeric(15,2) DEFAULT 0 NOT NULL,
    description text
);


ALTER TABLE public."JournalEntryLine" OWNER TO applizor;

--
-- Name: Lead; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Lead" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    company text,
    source text,
    status text DEFAULT 'new'::text NOT NULL,
    stage text DEFAULT 'lead'::text NOT NULL,
    value numeric(12,2),
    notes text,
    "assignedTo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "assignedAt" timestamp(3) without time zone,
    "convertedAt" timestamp(3) without time zone,
    "convertedToClientId" text,
    "createdBy" text,
    industry text,
    "jobTitle" text,
    "lastContactedAt" timestamp(3) without time zone,
    "nextFollowUpAt" timestamp(3) without time zone,
    priority text DEFAULT 'medium'::text NOT NULL,
    probability integer DEFAULT 0 NOT NULL,
    "sourceDetails" text,
    tags text[] DEFAULT ARRAY[]::text[],
    website text,
    currency text DEFAULT 'INR'::text NOT NULL
);


ALTER TABLE public."Lead" OWNER TO applizor;

--
-- Name: LeadActivity; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."LeadActivity" (
    id text NOT NULL,
    "leadId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text,
    outcome text,
    "scheduledAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "dueDate" timestamp(3) without time zone,
    "reminderSent" boolean DEFAULT false NOT NULL,
    "reminderTime" timestamp(3) without time zone,
    "assignedTo" text,
    "createdBy" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LeadActivity" OWNER TO applizor;

--
-- Name: LeaveAccrual; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."LeaveAccrual" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "leaveTypeId" text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    "accruedDays" double precision NOT NULL,
    "totalAccrued" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LeaveAccrual" OWNER TO applizor;

--
-- Name: LeaveRequest; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."LeaveRequest" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "leaveTypeId" text NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    days double precision NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    "approvedBy" text,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "assignedBy" text,
    "attachmentPath" text,
    "durationType" text DEFAULT 'full'::text NOT NULL,
    category text,
    "lopDays" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public."LeaveRequest" OWNER TO applizor;

--
-- Name: LeaveType; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."LeaveType" (
    id text NOT NULL,
    name text NOT NULL,
    days integer DEFAULT 0 NOT NULL,
    "isPaid" boolean DEFAULT true NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    frequency text DEFAULT 'yearly'::text NOT NULL,
    "carryForward" boolean DEFAULT true NOT NULL,
    "maxCarryForward" integer DEFAULT 0 NOT NULL,
    "monthlyLimit" integer DEFAULT 0 NOT NULL,
    "accrualRate" double precision DEFAULT 0 NOT NULL,
    "accrualStartMonth" integer DEFAULT 1 NOT NULL,
    "accrualType" text DEFAULT 'yearly'::text NOT NULL,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    "departmentIds" text[] DEFAULT ARRAY[]::text[],
    "employmentStatus" text[] DEFAULT ARRAY[]::text[],
    encashable boolean DEFAULT false NOT NULL,
    "maxAccrual" double precision DEFAULT 0 NOT NULL,
    "maxConsecutiveDays" integer DEFAULT 0 NOT NULL,
    "minServiceDays" integer DEFAULT 0 NOT NULL,
    "positionIds" text[] DEFAULT ARRAY[]::text[],
    "proofRequired" boolean DEFAULT false NOT NULL,
    "sandwichRule" boolean DEFAULT false NOT NULL,
    "policySettings" jsonb,
    "confirmationBonus" double precision DEFAULT 0 NOT NULL,
    "probationQuota" double precision DEFAULT 0 NOT NULL,
    "quarterlyLimit" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."LeaveType" OWNER TO applizor;

--
-- Name: LedgerAccount; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."LedgerAccount" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    balance numeric(15,2) DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LedgerAccount" OWNER TO applizor;

--
-- Name: Milestone; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Milestone" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    title text NOT NULL,
    description text,
    "dueDate" timestamp(3) without time zone,
    amount numeric(12,2),
    status text DEFAULT 'pending'::text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    "reviewStatus" text DEFAULT 'none'::text NOT NULL
);


ALTER TABLE public."Milestone" OWNER TO applizor;

--
-- Name: OfferLetter; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."OfferLetter" (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    "position" text NOT NULL,
    department text,
    salary numeric(12,2) NOT NULL,
    "startDate" date NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "documentPath" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "templateId" text
);


ALTER TABLE public."OfferLetter" OWNER TO applizor;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "invoiceId" text,
    amount numeric(12,2) NOT NULL,
    "paymentDate" date NOT NULL,
    "paymentMethod" text NOT NULL,
    gateway text,
    "transactionId" text,
    "gatewayOrderId" text,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO applizor;

--
-- Name: Payroll; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Payroll" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "basicSalary" numeric(12,2) NOT NULL,
    allowances numeric(12,2) DEFAULT 0 NOT NULL,
    deductions numeric(12,2) DEFAULT 0 NOT NULL,
    "earningsBreakdown" jsonb,
    "deductionsBreakdown" jsonb,
    "grossSalary" numeric(12,2) NOT NULL,
    "netSalary" numeric(12,2) NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "processedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payroll" OWNER TO applizor;

--
-- Name: Policy; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Policy" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    title text NOT NULL,
    description text,
    category text,
    "fileUrl" text,
    "effectiveDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Policy" OWNER TO applizor;

--
-- Name: Position; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Position" (
    id text NOT NULL,
    "departmentId" text NOT NULL,
    title text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Position" OWNER TO applizor;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text,
    name text NOT NULL,
    description text,
    status text DEFAULT 'planning'::text NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    budget numeric(12,2),
    "isBillable" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "actualExpenses" numeric(12,2),
    "actualRevenue" numeric(12,2),
    priority text DEFAULT 'medium'::text NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    settings jsonb,
    currency text DEFAULT 'INR'::text NOT NULL
);


ALTER TABLE public."Project" OWNER TO applizor;

--
-- Name: ProjectMember; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."ProjectMember" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    "employeeId" text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "canManageTasks" boolean DEFAULT true NOT NULL,
    "canManageTeam" boolean DEFAULT false NOT NULL,
    "canViewBudget" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."ProjectMember" OWNER TO applizor;

--
-- Name: ProjectNote; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."ProjectNote" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "isPinned" boolean DEFAULT false NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProjectNote" OWNER TO applizor;

--
-- Name: Quotation; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Quotation" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "leadId" text,
    "clientId" text,
    "quotationNumber" text NOT NULL,
    title text NOT NULL,
    description text,
    "quotationDate" date NOT NULL,
    "validUntil" date NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    tax numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    "paymentTerms" text,
    "deliveryTerms" text,
    notes text,
    "pdfPath" text,
    "templateId" text,
    "publicToken" text,
    "publicExpiresAt" timestamp(3) without time zone,
    "isPublicEnabled" boolean DEFAULT false NOT NULL,
    "clientViewedAt" timestamp(3) without time zone,
    "clientAcceptedAt" timestamp(3) without time zone,
    "clientRejectedAt" timestamp(3) without time zone,
    "clientSignature" text,
    "clientEmail" text,
    "clientName" text,
    "clientComments" text,
    "signedPdfPath" text,
    "convertedToInvoiceId" text,
    "convertedAt" timestamp(3) without time zone,
    "createdBy" text,
    "assignedTo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "emailOpens" integer DEFAULT 0 NOT NULL,
    "lastEmailOpenedAt" timestamp(3) without time zone,
    "lastViewedAt" timestamp(3) without time zone,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "maxReminders" integer DEFAULT 3 NOT NULL,
    "nextReminderAt" timestamp(3) without time zone,
    "reminderCount" integer DEFAULT 0 NOT NULL,
    "reminderFrequency" text
);


ALTER TABLE public."Quotation" OWNER TO applizor;

--
-- Name: QuotationActivity; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."QuotationActivity" (
    id text NOT NULL,
    "quotationId" text NOT NULL,
    type text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    location text,
    "deviceType" text,
    browser text,
    os text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."QuotationActivity" OWNER TO applizor;

--
-- Name: QuotationItem; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."QuotationItem" (
    id text NOT NULL,
    "quotationId" text NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    "unitPrice" numeric(12,2) NOT NULL,
    tax numeric(5,2) DEFAULT 0 NOT NULL,
    discount numeric(5,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    "taxRateId" text,
    unit text,
    "hsnSacCode" text
);


ALTER TABLE public."QuotationItem" OWNER TO applizor;

--
-- Name: QuotationItemTax; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."QuotationItemTax" (
    id text NOT NULL,
    "quotationItemId" text NOT NULL,
    "taxRateId" text NOT NULL,
    name text NOT NULL,
    percentage numeric(5,2) NOT NULL,
    amount numeric(12,2) NOT NULL
);


ALTER TABLE public."QuotationItemTax" OWNER TO applizor;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Role" OWNER TO applizor;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."RolePermission" (
    id text NOT NULL,
    "roleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createLevel" text DEFAULT 'none'::text NOT NULL,
    "deleteLevel" text DEFAULT 'none'::text NOT NULL,
    module text NOT NULL,
    "readLevel" text DEFAULT 'none'::text NOT NULL,
    "updateLevel" text DEFAULT 'none'::text NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO applizor;

--
-- Name: SalaryComponent; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."SalaryComponent" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "calculationType" text NOT NULL,
    "defaultValue" numeric(12,2) DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isTaxable" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."SalaryComponent" OWNER TO applizor;

--
-- Name: SalesTarget; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."SalesTarget" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "employeeId" text NOT NULL,
    period text NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    "targetAmount" numeric(12,2) NOT NULL,
    "achievedAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SalesTarget" OWNER TO applizor;

--
-- Name: Shift; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Shift" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "breakDuration" integer DEFAULT 60 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "workDays" jsonb
);


ALTER TABLE public."Shift" OWNER TO applizor;

--
-- Name: ShiftRoster; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."ShiftRoster" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "shiftId" text NOT NULL,
    date date NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ShiftRoster" OWNER TO applizor;

--
-- Name: Sprint; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Sprint" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    name text NOT NULL,
    goal text,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    status text DEFAULT 'future'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Sprint" OWNER TO applizor;

--
-- Name: StatutoryConfig; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."StatutoryConfig" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "pfEmployeeRate" numeric(5,2) DEFAULT 12.0 NOT NULL,
    "pfEmployerRate" numeric(5,2) DEFAULT 12.0 NOT NULL,
    "pfBasicLimit" numeric(12,2) DEFAULT 15000.0 NOT NULL,
    "esiEmployeeRate" numeric(5,3) DEFAULT 0.75 NOT NULL,
    "esiEmployerRate" numeric(5,3) DEFAULT 3.25 NOT NULL,
    "esiGrossLimit" numeric(12,2) DEFAULT 21000.0 NOT NULL,
    "professionalTaxEnabled" boolean DEFAULT true NOT NULL,
    "tdsEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StatutoryConfig" OWNER TO applizor;

--
-- Name: Subscription; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Subscription" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "clientId" text NOT NULL,
    name text NOT NULL,
    plan text NOT NULL,
    amount numeric(12,2) NOT NULL,
    "billingCycle" text DEFAULT 'monthly'::text NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date,
    status text DEFAULT 'active'::text NOT NULL,
    "nextBillingDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL
);


ALTER TABLE public."Subscription" OWNER TO applizor;

--
-- Name: Task; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Task" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'todo'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "createdById" text,
    "assignedToId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "milestoneId" text,
    tags text[] DEFAULT ARRAY[]::text[],
    type text DEFAULT 'task'::text NOT NULL,
    "createdClientId" text,
    "epicId" text,
    "parentId" text,
    "position" double precision DEFAULT 0 NOT NULL,
    "sprintId" text,
    "startDate" timestamp(3) without time zone,
    "storyPoints" integer DEFAULT 0
);


ALTER TABLE public."Task" OWNER TO applizor;

--
-- Name: TaskComment; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."TaskComment" (
    id text NOT NULL,
    "taskId" text NOT NULL,
    content text NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientId" text,
    "parentId" text
);


ALTER TABLE public."TaskComment" OWNER TO applizor;

--
-- Name: TaskHistory; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."TaskHistory" (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "userId" text,
    "clientId" text,
    field text NOT NULL,
    "oldValue" text,
    "newValue" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TaskHistory" OWNER TO applizor;

--
-- Name: TaskLink; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."TaskLink" (
    id text NOT NULL,
    "sourceId" text NOT NULL,
    "targetId" text NOT NULL,
    "relationType" text DEFAULT 'relates_to'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TaskLink" OWNER TO applizor;

--
-- Name: TaskWatcher; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."TaskWatcher" (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TaskWatcher" OWNER TO applizor;

--
-- Name: TaxRate; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."TaxRate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    percentage numeric(5,2) NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TaxRate" OWNER TO applizor;

--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Ticket" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "assignedToId" text,
    "clientContactId" text,
    "createdById" text NOT NULL
);


ALTER TABLE public."Ticket" OWNER TO applizor;

--
-- Name: TicketComment; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."TicketComment" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TicketComment" OWNER TO applizor;

--
-- Name: TicketMessage; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."TicketMessage" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "senderId" text,
    content text NOT NULL,
    "isInternal" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TicketMessage" OWNER TO applizor;

--
-- Name: Timesheet; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Timesheet" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "projectId" text,
    "employeeId" text NOT NULL,
    date date NOT NULL,
    hours numeric(5,2) NOT NULL,
    "isBillable" boolean DEFAULT true NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone,
    "startTime" timestamp(3) without time zone,
    "taskId" text,
    "approvedAt" timestamp(3) without time zone,
    "approvedBy" text,
    "rejectionReason" text,
    status text DEFAULT 'draft'::text NOT NULL,
    "submittedAt" timestamp(3) without time zone
);


ALTER TABLE public."Timesheet" OWNER TO applizor;

--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    description text,
    reference text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Transaction" OWNER TO applizor;

--
-- Name: UnitType; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."UnitType" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    symbol text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UnitType" OWNER TO applizor;

--
-- Name: User; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "companyId" text
);


ALTER TABLE public."User" OWNER TO applizor;

--
-- Name: UserRole; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."UserRole" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "roleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserRole" OWNER TO applizor;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO applizor;

--
-- Name: active_timers; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public.active_timers (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "employeeId" text NOT NULL,
    "projectId" text NOT NULL,
    "taskId" text,
    "startTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "accumulatedTime" integer DEFAULT 0 NOT NULL,
    "isPaused" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.active_timers OWNER TO applizor;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    link text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO applizor;

--
-- Name: quotation_templates; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public.quotation_templates (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    title text NOT NULL,
    "templateDescription" text NOT NULL,
    "paymentTerms" text,
    "deliveryTerms" text,
    notes text,
    items jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.quotation_templates OWNER TO applizor;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Account" (id, code, name, type, "parentId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Asset" (id, "companyId", name, type, "serialNumber", status, "purchaseDate", price, "employeeId", "assignedDate", "createdAt", "updatedAt", currency) FROM stdin;
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Attendance" (id, "employeeId", date, "checkIn", "checkOut", status, "ipAddress", location, notes, "createdAt", "updatedAt") FROM stdin;
9e2150c4-a28d-484d-99c4-cf16246898e8	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	2026-01-26	2026-01-26 13:02:17.832	\N	present	::ffff:192.168.65.1	18.539832084298013,73.94504782890894	\N	2026-01-26 13:02:17.833	2026-01-26 13:02:17.833
0e6469a3-d9ca-44fb-92fa-57b72ec02a5f	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	2026-01-27	2026-01-27 06:26:42.87	\N	present	::ffff:192.168.65.1	18.539770749863937,73.94509739243485	\N	2026-01-27 06:26:42.871	2026-01-27 06:26:42.871
ff8a8827-bd38-4d70-b019-6504a6e2bb09	92f82430-03a8-4ea2-bd52-76d52f439c8d	2026-01-28	2026-01-27 18:40:50.447	2026-01-27 18:59:58.36	present	::ffff:192.168.65.1	\N	\N	2026-01-27 18:40:50.448	2026-01-27 18:59:58.361
35d56c3b-ef32-4c91-a142-316bb0bb8ce3	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	2026-02-03	2026-02-03 13:34:54.397	\N	present	::ffff:192.168.65.1	\N	\N	2026-02-03 13:34:54.399	2026-02-03 13:34:54.399
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."AuditLog" (id, "companyId", "userId", action, module, "entityType", "entityId", details, changes, "ipAddress", "userAgent", "createdAt") FROM stdin;
726eecce-ecd9-493c-9718-7aff00df05dc	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-23 04:27:07.171
45582b39-8692-4508-af4d-0e201f7404c8	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-23 04:27:08.008
a16f6ff9-f5d1-4187-9d1a-4f6a94ab288f	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-23 04:27:08.67
24068256-ca0f-424e-9356-2e9351ce615d	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-23 04:35:36.272
faae0527-5de3-4274-b907-29e472ec0c70	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-23 04:50:12.075
f59d0600-6c5c-4393-afcc-433c1c349e2f	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 07:28:42.341
04bcbe15-f484-4890-8f6b-9c8f3d683fcd	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 10:12:39.098
34a292c9-f764-4bfc-b250-7725b0c29957	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 11:47:56.198
4f2d831d-f718-4fb5-93a0-7c57bae35fe3	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 11:47:57.577
107879ea-a9f4-4ae5-9188-e3d42faea958	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 11:48:12.101
7e5e88af-ceb6-426a-b675-3c19f0a27a51	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 12:05:13.483
fa70ce4b-13b5-4d90-b006-62062e836ec3	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	UPDATE	INVOICE	Invoice	f0fdc3b7-dd0d-4d22-9ba3-db81214f6a14	Updated invoice INV-2026-0001	\N	\N	\N	2026-01-26 12:08:36.208
7e327432-f8b7-4951-ab6e-1ec13bca3aa8	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 12:23:41.213
7e0c942c-c3a1-4442-a6f1-258a32c9f71c	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 12:30:19.765
629c1de4-7e41-46be-b580-2f29346ec4aa	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	CREATE	HRMS	Employee	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	Created employee emp1 EMP (ID: EMP-0001)	{"email": "applizor1@gmail.com", "phone": "", "gender": "Male", "roleId": "2af33051-91e2-49b0-be8e-e879b80dc41c", "status": "active", "bankName": "", "ifscCode": "", "lastName": "EMP", "password": "12345", "firstName": "emp1", "panNumber": "", "employeeId": "", "positionId": "020858a5-3766-4388-99cb-39f9af2c2879", "dateOfBirth": "1998-04-01", "departmentId": "a9e50298-d5db-4b87-8ab6-a8e12194321d", "aadhaarNumber": "", "accountNumber": "", "createAccount": true, "dateOfJoining": "2026-01-26", "maritalStatus": "Single", "currentAddress": "Bhopal madhya pradesh india", "permanentAddress": "Bhopal madhya pradesh india"}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 12:40:38.771
be2e594f-f75f-441d-bc52-40c79f704c64	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	UPDATE	HRMS	Employee	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	Updated employee emp1 EMP	{"email": "applizor1@gmail.com", "phone": "", "gender": "Male", "skills": "", "status": "active", "bankName": "", "ifscCode": "", "lastName": "EMP", "firstName": "emp1", "panNumber": "", "bloodGroup": "", "hourlyRate": "", "positionId": "020858a5-3766-4388-99cb-39f9af2c2879", "dateOfBirth": "1998-04-01", "departmentId": "a9e50298-d5db-4b87-8ab6-a8e12194321d", "aadhaarNumber": "", "accountNumber": "", "dateOfJoining": "2026-01-26", "maritalStatus": "Single", "slackMemberId": "", "currentAddress": "Bhopal madhya pradesh india", "employmentType": "Full Time", "permanentAddress": "Bhopal madhya pradesh india", "probationEndDate": "", "noticePeriodEndDate": "", "noticePeriodStartDate": ""}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 12:41:01.364
246a71ef-fb36-42d3-9558-f9fba2b81b7c	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	UPLOAD	DOCUMENT	Document	56a3dc63-8438-44b4-8ff6-54e515295d66	Uploaded document Contract-SOFTWARE DEVELOPMENT AGREEMENT (7).pdf for employee emp1 EMP	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 12:51:09.826
6471bd0c-b6b4-461b-8c6f-4f8fecc15535	\N	\N	LOGIN	AUTH	User	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 12:56:17.845
691e3b5b-2064-4bd3-98a8-961af6b2c500	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 12:57:45.467
c7ba3e6f-a5d5-4a34-b0aa-593f3dd0e7d2	\N	\N	LOGIN	AUTH	User	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 13:02:06.52
12b5b979-fb2d-4457-8cd2-7fcb3d8c86cb	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 13:02:59.659
43d98ea7-5bb9-454f-a9ef-57414120d6e6	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	UPLOAD	DOCUMENT	Document	452964d8-de84-407b-b2fa-37aef0b69827	Uploaded document a62d36b5e828c380ac280eb549e24e13.png for employee emp1 EMP	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 13:07:53.646
db5b2b96-60b8-471c-9e8a-79494d4c0f90	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 14:56:07.35
b7bcb7d7-797f-4288-8f57-22542e82b8ee	\N	\N	LOGIN	AUTH	User	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 06:26:20.001
c754cbc6-81af-490a-a09b-bd2d3f59a5f6	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 12:32:44.247
d8cf9093-f382-446f-a34b-84adcda9476e	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 12:32:47.914
effdb732-1cfb-4c29-a104-cbfca377793d	\N	\N	LOGIN	AUTH	User	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:36:18.694
5a026425-6fa9-4bdb-b3ad-3d4c3c5f8bd5	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 14:12:45.43
f82ca1b6-cf62-4d28-b3c8-16d52d036823	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 14:19:04.258
011a62b5-0621-4f54-9aa3-54a77206e28b	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 14:19:05.183
cc748c2b-b6a0-4e61-8849-746d29697421	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	CREATE	HRMS	Employee	92f82430-03a8-4ea2-bd52-76d52f439c8d	Created employee sapplizor sapplizor (ID: EMP-0002)	{"email": "sapplizor@gmail.com", "phone": "", "gender": "Male", "roleId": "2af33051-91e2-49b0-be8e-e879b80dc41c", "status": "active", "bankName": "", "ifscCode": "", "lastName": "sapplizor", "password": "12345", "firstName": "sapplizor", "panNumber": "", "employeeId": "", "positionId": "020858a5-3766-4388-99cb-39f9af2c2879", "departmentId": "a9e50298-d5db-4b87-8ab6-a8e12194321d", "aadhaarNumber": "", "accountNumber": "", "createAccount": true, "dateOfJoining": "2026-01-27", "currentAddress": "", "employmentType": "Full Time", "permanentAddress": ""}	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 14:22:53.759
aa0e2482-4626-41e4-9f3a-f5589c215cb0	\N	\N	LOGIN	AUTH	User	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 15:15:12.24
d151d5ab-96e6-41f0-80c1-664108dd71fa	\N	\N	LOGIN	AUTH	User	1baee587-356c-421c-8df7-cd0c2ceefea7	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 18:40:37.566
ff7a65a3-c925-412e-8f3a-f94720ec3aba	\N	\N	LOGIN	AUTH	User	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 19:00:09.869
98837a44-25bc-44c1-ba28-44c567035d84	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	UPLOAD	DOCUMENT	Document	7f35ece1-8273-435c-9409-2f97e3b427f6	Uploaded document applizor-logo (1).jpg for employee sapplizor sapplizor	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-30 07:34:17.564
b6af28fe-7343-4c3d-9ab0-67b1b2622161	\N	\N	LOGIN	AUTH	User	1baee587-356c-421c-8df7-cd0c2ceefea7	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-30 07:35:46.084
9fabdbba-6a6c-47ec-8bfd-78926f54a6ac	\N	\N	LOGIN	AUTH	User	1baee587-356c-421c-8df7-cd0c2ceefea7	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-30 08:03:55.643
b8ce1b2f-fc91-4dd0-a3ff-a8264a28c60b	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-01 10:31:00.674
16db4273-a353-4371-81e7-d35451080f0f	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-01 10:31:01.957
2a7aef86-b3e9-4a62-adcf-3b53f4a8edd3	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-01 13:23:09.816
9f453336-f15d-4fd5-a84d-abb801df500e	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	7727d5cb-718f-4b3b-ac3d-c230dbd8f671	Deleted invoice INV-2026-0002	\N	\N	\N	2026-02-01 13:35:46.191
7b8a3cb7-c870-4af0-a550-a645a1cbce9b	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	769dd3d6-adb9-44db-ac74-5a12281f48c1	Deleted invoice INV-2026-0002	\N	\N	\N	2026-02-01 13:43:06.185
96ecd63f-1da0-4172-9277-389200dd4dfc	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	c4da5980-649f-4393-a518-2d696c1a4d61	Deleted invoice INV-2026-0002	\N	\N	\N	2026-02-01 14:16:57.959
91b2b683-1bf8-4024-9687-082541f2ff94	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	bbbdc16e-130a-424e-8f54-47534899bd03	Deleted invoice INV-2026-0002	\N	\N	\N	2026-02-01 14:37:29.137
429e51c8-71c3-4a42-b0bb-2883e03553a3	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	9437deb0-71a7-4402-ac3a-023f090140ce	Deleted invoice INV-2026-0002	\N	\N	\N	2026-02-01 15:11:32.368
dc49c190-bbcf-4415-b0e8-129900b78f09	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	9ca29c81-413a-4863-af81-bced53084867	Deleted invoice INV-2026-0002	\N	\N	\N	2026-02-01 15:12:00.647
85c89318-8b6c-4d80-a52d-f3f211a74417	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	fd384e0a-3a80-4469-9ef9-7486cdf733fe	Deleted invoice INV-2026-0002	\N	\N	\N	2026-02-01 15:12:19.195
9955edc9-77f9-4de7-909c-f29e74261937	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	224fdc8c-380b-4fb0-9b43-88aa750d0c35	Deleted invoice INV-2026-0002	\N	\N	\N	2026-02-01 15:15:07.195
c47b60a6-96f7-4a35-96d0-32cdc26bacf8	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	c2141423-dbf9-46f5-a7f0-ecdddf723cb6	Deleted invoice INV-2026-0003	\N	\N	\N	2026-02-01 15:17:27.435
cd146dc9-cac8-4590-97c7-eed5fa620cc3	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	CREATE	INVOICE	Invoice	93e6d7b9-5bd2-4a6d-a205-7501d367f16c	Created invoice INV-2026-00002	\N	\N	\N	2026-02-01 15:18:16.558
b5703d9f-054b-4649-9c3e-8475c580711a	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	93e6d7b9-5bd2-4a6d-a205-7501d367f16c	Deleted invoice INV-2026-00002	\N	\N	\N	2026-02-01 15:19:08.702
a715c0d8-7ac2-4063-8a82-4b48a2d64c73	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	CREATE	INVOICE	Invoice	a28084b1-77e8-4442-aa6f-4d20d5ccb8e9	Created invoice INV-2026-00002	\N	\N	\N	2026-02-01 15:20:39.343
7485e7ce-6d70-4386-9838-8912ef31147b	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	a28084b1-77e8-4442-aa6f-4d20d5ccb8e9	Deleted invoice INV-2026-00002	\N	\N	\N	2026-02-01 15:29:49.808
db9dd89f-6dff-49fd-840e-f9851f0c0f45	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	CREATE	INVOICE	Invoice	5b3fe7b5-550f-48eb-a6b8-afd6848e366e	Created invoice INV-2026-00002	\N	\N	\N	2026-02-01 15:33:32.941
75a4e9ad-3552-45ff-949b-7982ffc63840	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	5b3fe7b5-550f-48eb-a6b8-afd6848e366e	Deleted invoice INV-2026-00002	\N	\N	\N	2026-02-01 15:47:51.678
45873746-09f2-4aa6-8baa-a5520b4ca5b0	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	CREATE	INVOICE	Invoice	1409f1b8-2745-417f-965f-b4868d9b7eda	Created invoice INV-2026-00002	\N	\N	\N	2026-02-01 15:50:10.19
d045b619-3e4b-4473-b854-5f543e60a927	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	1409f1b8-2745-417f-965f-b4868d9b7eda	Deleted invoice INV-2026-00002	\N	\N	\N	2026-02-03 11:12:19.012
eaa8f4a2-85d2-4b33-976d-011e70b6ae1c	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	CREATE	INVOICE	Invoice	0ebaf46c-fdb2-4cdd-8b9a-0ba2cf73d3d9	Created invoice INV-2026-00002	\N	\N	\N	2026-02-03 11:12:35.422
0f69d440-bfba-48bc-9bfd-69957c0cb3bf	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 12:07:58.885
db868ae3-2fcc-48ac-b8b4-e1f2dc316ebe	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 12:08:01.303
70c985f9-ca4d-4e80-9832-e72b10c96fce	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:23:41.357
361ccfab-0354-4d33-bd57-687673b0e4de	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:27:32.35
f47946bb-3f64-45bc-9eb7-c4ba5bb301b7	\N	\N	LOGIN	AUTH	User	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:34:18.167
51a4c09a-b6c0-4548-8c97-c4daf9ca306b	\N	\N	LOGIN	AUTH	User	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:58:35.543
0c5848ce-53d6-470d-b065-01ff2b13ec1c	\N	\N	LOGIN	AUTH	User	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 18:37:19.473
9e051340-6172-42e4-9178-64e4e47641fe	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 18:37:57.214
2e5e942e-ab13-49b9-8b5e-6e0027bb73e6	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 19:08:16.331
944ccc4c-66f2-41b7-a135-a68354886653	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 19:08:44.978
05ea0251-28ba-409c-9272-39ef2f7dced6	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 19:10:08.027
6bad8711-0a9c-417f-9449-45a31ff80ad7	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 19:10:29.177
a67c9565-9405-46e4-87ca-15147402f90e	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 13:50:02.168
c795ce87-3b98-4368-8080-61308b8623e3	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 14:26:30.262
5ee653dd-fd7e-421f-97a7-d107afdf0ce2	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 14:26:32.837
2d8a9654-adce-486a-94b8-72bd280b664f	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 14:58:05.165
4c1650f1-d8c2-4bb9-8be6-33d084fac0af	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 15:03:52.079
0c040048-85cd-4430-a62d-76b42ee1efae	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 15:04:18.448
7ef28542-2078-42f8-8d93-ab07060a53ee	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 15:06:53.498
6f0a6d7e-4684-4b17-8383-d27184e6cd0b	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 15:07:37.657
967ca5a3-851f-40d0-b4bf-592287817d5c	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 15:47:33.896
d6f24726-47e7-4216-9370-7c5dd973b550	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 15:47:35.987
e7bcc55e-7c39-4d93-8203-0ef9d665aca6	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 16:18:44.593
14fc9f3f-3708-4300-b0e6-65a35c6b0a8e	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 16:33:17.013
8f3f2aa5-31fc-4501-ab41-6462af04b3d3	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 16:33:23.663
f92fa9a3-59c9-4eb1-8738-2b5bdd39013e	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	0ebaf46c-fdb2-4cdd-8b9a-0ba2cf73d3d9	Deleted invoice INV-2026-00002	\N	\N	\N	2026-02-09 11:46:24.695
c172acdf-ff8b-4f28-8cf1-9481681878a1	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	CREATE	INVOICE	Invoice	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	Created invoice INV-2026-00002	\N	\N	\N	2026-02-09 11:48:41.731
86f99df3-d7eb-41d3-adae-858054071f17	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	UPDATE	INVOICE	Invoice	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	Updated invoice INV-2026-00002	\N	\N	\N	2026-02-09 11:55:39.096
acbff50a-1139-4444-b3e5-55aeede46e20	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	UPDATE	INVOICE	Invoice	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	Updated invoice INV-2026-00002	\N	\N	\N	2026-02-09 11:58:07.466
b0e58a6b-ca10-4f5e-9dd2-93a48a7a2680	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	UPDATE	INVOICE	Invoice	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	Updated invoice INV-2026-00002	\N	\N	\N	2026-02-09 13:35:44.938
1964279f-7eaf-480b-9e74-09c88a947b18	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	UPDATE	INVOICE	Invoice	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	Updated invoice INV-2026-00002	\N	\N	\N	2026-02-09 13:37:10.464
3605ebfc-a796-4401-987a-680f9a5a8194	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	CREATE	INVOICE	Invoice	6f23d7a4-1043-44d6-acf0-283de66d19f2	Created invoice INV-2026-00003	\N	\N	\N	2026-02-10 06:05:14.891
1928afc4-e137-4caa-918c-691b5251d729	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	CREATE	INVOICE	Invoice	ff885d2e-fa37-4287-9080-a74dfe14f63d	Created invoice INV-2026-00004	\N	\N	\N	2026-02-10 06:07:44.93
559bd60b-f3ee-48cb-8e25-1b2adb17375d	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	6f23d7a4-1043-44d6-acf0-283de66d19f2	Deleted invoice INV-2026-00003	\N	\N	\N	2026-02-10 06:10:16.739
e5a97bfb-c161-4ca7-8790-4cd868a26751	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	UPDATE	INVOICE	Invoice	ff885d2e-fa37-4287-9080-a74dfe14f63d	Updated invoice INV-2026-00004	\N	\N	\N	2026-02-10 06:19:48.055
eab7debc-20c6-42e1-9ac9-6283c36683fb	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	UPDATE	INVOICE	Invoice	ff885d2e-fa37-4287-9080-a74dfe14f63d	Updated invoice INV-2026-00004	\N	\N	\N	2026-02-10 06:19:48.355
5dfa0b58-0678-4d40-a0b3-5a63d585667e	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	UPDATE	INVOICE	Invoice	ff885d2e-fa37-4287-9080-a74dfe14f63d	Updated invoice INV-2026-00004	\N	\N	\N	2026-02-10 06:21:44.074
06b24154-dd19-43d7-891e-59c2f1bddb81	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	UPDATE	INVOICE	Invoice	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	Updated invoice INV-2026-00002	\N	\N	\N	2026-02-10 06:43:19.918
3d32db9d-6e11-4196-9b75-ee214bf81d49	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	UPDATE	INVOICE	Invoice	ff885d2e-fa37-4287-9080-a74dfe14f63d	Updated invoice INV-2026-00004	\N	\N	\N	2026-02-10 09:23:08.873
1ffc1b45-6784-4eda-b0ba-fcf06400de61	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	DELETE	PAYMENT	Payment	72da6e7e-ebf6-4d34-bb4f-ce02be961ed3	Deleted payment of 1000 for Invoice INV-2026-0001	\N	\N	\N	2026-02-10 09:28:12.248
af0ae051-2083-4731-90a4-7f0e5f2f72ea	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	DELETE	PAYMENT	Payment	09951e94-0c1d-43a3-8e0d-6b814609c596	Deleted payment of 140600 for Invoice INV-2026-0001	\N	\N	\N	2026-02-10 09:28:14.957
8773a555-706b-4fa4-be1a-8c15f70fad91	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	f0fdc3b7-dd0d-4d22-9ba3-db81214f6a14	Deleted invoice INV-2026-0001	\N	\N	\N	2026-02-10 09:28:20.609
24aa46fa-a163-4f9f-b1a9-6ef5f7f8135d	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	CREATE	INVOICE	Invoice	02995eac-4878-4038-8421-c006ff8e1649	Created invoice INV-2026-00005	\N	\N	\N	2026-02-10 09:30:08.574
a780c50d-2282-46d9-a543-70aef1e5e81c	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	DELETE	INVOICE	Invoice	02995eac-4878-4038-8421-c006ff8e1649	Deleted invoice INV-2026-00005	\N	\N	\N	2026-02-10 09:32:49.036
\.


--
-- Data for Name: AutomationRule; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."AutomationRule" (id, "projectId", name, "triggerType", "triggerConfig", "actionType", "actionConfig", "isActive", "createdAt", "updatedAt") FROM stdin;
cb5bd4fd-2045-4468-bb3d-bf053338a304	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	email notification on task creation	TASK_CREATED	{"to": "done", "from": "*"}	SEND_EMAIL	{"body": "", "subject": "", "recipient": "custom", "customEmail": "info@applizor.com", "useTemplate": "created"}	t	2026-02-03 13:31:36.605	2026-02-03 13:31:36.605
528778c6-3be0-4d01-90ee-b98a5390fbdb	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	task assignment	TASK_ASSIGNED	{"to": "done", "from": "*"}	IN_APP_NOTIFICATION	{"body": "", "subject": "", "recipient": "assignee", "useTemplate": "assigned"}	t	2026-02-03 13:32:52.988	2026-02-03 13:32:52.988
ef2c1aa5-1a1b-4a0b-83c4-f6aa4a21a30d	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	task assignment email	TASK_ASSIGNED	{"to": "done", "from": "*"}	SEND_EMAIL	{"body": "", "subject": "", "recipient": "assignee", "useTemplate": "assigned"}	t	2026-02-03 13:33:12.263	2026-02-03 13:33:12.263
e22221c5-6a0d-42b0-b1c6-41cdc3a8979e	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	task status changed to client	TASK_STATUS_CHANGE	{"to": "review", "from": "*"}	SEND_EMAIL	{"body": "", "subject": "", "recipient": "client", "useTemplate": "status"}	t	2026-02-03 13:33:47.631	2026-02-03 13:33:47.631
11a7afd7-1002-43f5-a61e-1035baf54d1b	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	task status changed to client in app notification	TASK_STATUS_CHANGE	{"to": "review", "from": "*"}	IN_APP_NOTIFICATION	{"body": "", "subject": "", "recipient": "client", "useTemplate": "status"}	t	2026-02-03 13:34:09.523	2026-02-03 13:34:09.523
3bf48720-eae6-453c-a1e4-f0c210e5967a	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	on review to done task	TASK_STATUS_CHANGE	{"to": "done", "from": "review"}	SEND_EMAIL	{"body": "", "subject": "", "recipient": "assignee", "useTemplate": "status"}	t	2026-02-03 13:42:56.116	2026-02-03 13:42:56.116
a1cd6e06-3fa9-4f14-9223-6147923fd5d5	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	on taks done send mail to global email	TASK_STATUS_CHANGE	{"to": "done", "from": "review"}	SEND_EMAIL	{"body": "", "subject": "", "recipient": "custom", "customEmail": "info@applizor.com", "useTemplate": "status"}	t	2026-02-03 13:43:42.467	2026-02-03 13:43:42.467
20bdbd41-c5f7-4d68-8a23-b9093228a760	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	task create teams notification	TASK_CREATED	{"to": "done", "from": "*"}	TEAMS_NOTIFICATION	{"body": "", "subject": "", "recipient": "custom", "customEmail": "https://applizor.webhook.office.com/webhookb2/60d2a3f7-dd5b-440e-8ed3-0d1277eae2ce@db4daa01-9681-462b-ac7b-b09323e4f066/IncomingWebhook/0b6673a6e35b4975b904b8136cf40549/f56bc9db-0053-4996-b564-26e24a71becb/V2jUP8r0ujksnIlUskYgEp4VRWa63Zjiw6Y-dtuMNKuhI1", "useTemplate": "created"}	t	2026-02-03 14:17:37.284	2026-02-03 14:17:37.284
\.


--
-- Data for Name: Branch; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Branch" (id, "companyId", name, code, address, city, state, country, pincode, phone, email, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Candidate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Candidate" (id, "companyId", "jobOpeningId", "firstName", "lastName", email, phone, "resumePath", status, "currentStage", notes, rating, "createdAt", "updatedAt") FROM stdin;
3b85cac7-1dea-4012-b305-81c47b741017	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	5194737d-671f-4a76-91af-88f6e254fea5	testing	visk	jugal963075@gmail.com		\N	hired	Hired		\N	2026-02-05 15:15:06.699	2026-02-05 16:36:05.913
\.


--
-- Data for Name: Client; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Client" (id, "companyId", name, email, phone, address, city, state, country, pincode, gstin, pan, status, "clientType", "createdAt", "updatedAt", password, "portalAccess", "lastLogin", "createdById", notes, "shippingAddress", "taxName", website, "categoryId", "companyLogo", gender, language, mobile, "profilePicture", "receiveNotifications", salutation, "subCategoryId", "companyName", currency, tan) FROM stdin;
2107cb32-f387-4409-8404-56407832b1b5	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Lakhan	arunrwds@gmail.com					India			\N	active	customer	2026-01-27 19:03:48.247	2026-02-01 08:36:42.665	$2a$10$7BXPztwzioIkB.DicTYVueIh0DHc2Y8RT4fX1Uz.FH49yx75r6Yvy	t	2026-02-01 08:36:42.664	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9					ebf7056f-5c8a-4912-9cd6-bd978b03433b		male	English			t	Mr.	\N	wellness for you	INR	\N
b5fbcbfd-deb9-421b-9932-fb1420d0562a	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Arun Kumar Vishwakarma	arun1601for@gmail.com	+919226889662	404 VARADRAJ HEIGHTS\nSHIVTIRTH NAGAR MARUNJI ROAD HINJEWADI PHASE 1	PUNE	Maharashtra	India	411057			active	customer	2026-01-23 04:35:58.81	2026-02-01 08:21:22.469	$2a$10$B0n9HLvgDG/lwf7BBUgP4u8IrreeW/A5BwrkyJgoVibrfiw7WDKQ6	t	2026-02-01 08:21:22.468	\N		404 VARADRAJ HEIGHTS\nSHIVTIRTH NAGAR MARUNJI ROAD HINJEWADI PHASE 1		safalcode.com	ebf7056f-5c8a-4912-9cd6-bd978b03433b	/uploads/logos/image-1769426410650-582254553.png	male	English	7773899355	/uploads/profiles/profile-1769426405654-928529587.png	t	Mr.	\N	Safalcode Tech	INR	\N
ba44724c-4300-4993-bd22-c151c1e8527a	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Lakhan	arunsvishwakarma99999@gmail.com	+91 6206418710				India			\N	active	customer	2026-02-01 08:49:53.891	2026-02-03 14:17:48.765	$2a$10$A1ZPdYKPiZyn1XNaqVNO0OuGQQLXpF3HonR4/PH34XwyWw8N06zKy	t	2026-02-03 14:17:48.763	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9					ebf7056f-5c8a-4912-9cd6-bd978b03433b		male	English			t	Mr.	\N	DR UPCHAR	INR	\N
bc6720f1-e405-42b8-8a2e-72976f715cd4	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Ajay Kumar	info@itlabspeed.com		2ND FLOOR OFFICE NO B-13, ZINNIA ELEGANS, WAKAD ROAD, SURVEY NO 80, HISSA NO 1, VINODE NAGAR, WAKAD	Pune	Maharashtra	India	411057	27AAKFI7572F1Z1	AAKFI7572F	active	customer	2026-02-09 11:26:43.066	2026-02-09 11:39:01.751	$2a$10$cZZfKQIi4IiFjN.4yObT1O08jnjWfT5pYTTDXCIm6JV5zA.JPmOAm	t	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9		2ND FLOOR OFFICE NO B-13, ZINNIA ELEGANS, WAKAD ROAD, SURVEY NO 80, HISSA NO 1, VINODE NAGAR, WAKAD	GST	https://itlabspeed.com/	ebf7056f-5c8a-4912-9cd6-bd978b03433b		male	English	9721170880		f	Mr.	\N	IT LAB SPEED	INR	
41611cb0-b1d6-4d55-8be3-50f2f706cdef	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Rahul Paith	director@martecksolutions.com		Hyderabad, Telangana, India			India				active	customer	2026-02-10 06:01:56.062	2026-02-10 06:09:06.789	\N	f	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9		Hyderabad, Telangana, India		 https://martecksolutions.com/	\N		male	English	9804317102		f	Mr.	\N	Marteck solutions opc pvt Ltd	INR	
b1967151-5e54-4081-93f3-6ce5791cb641	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Rahul Paith	sales@usmsystems.com		Hyderabad, Telangana, India			India				active	customer	2026-02-10 09:20:47.32	2026-02-10 09:25:34.069	\N	f	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9		Hyderabad, Telangana, India		https://usmsystems.com/	\N		male	English	9804317102		t	Mr.	\N	USM SYSTEMS	INR	
\.


--
-- Data for Name: ClientCategory; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ClientCategory" (id, "companyId", name, "createdAt", "updatedAt") FROM stdin;
ebf7056f-5c8a-4912-9cd6-bd978b03433b	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Health	2026-01-26 11:03:02.252	2026-01-26 11:03:02.252
\.


--
-- Data for Name: ClientSubCategory; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ClientSubCategory" (id, "categoryId", name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Company" (id, name, "legalName", email, phone, address, city, state, country, pincode, gstin, pan, logo, "letterheadDoc", "allowedIPs", latitude, longitude, radius, "isActive", "enabledModules", "createdAt", "updatedAt", currency, tan, "continuationSheet", "digitalSignature", letterhead, "pdfContinuationTop", "pdfMarginBottom", "pdfMarginLeft", "pdfMarginRight", "pdfMarginTop", "bankAccountName", "bankAccountNumber", "bankBranch", "bankIfscCode", "bankName") FROM stdin;
b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Applizor Softech LLP	Applizor Softech LLP	connect@applizor.com	9130309480	209, WARD NO 7, VISHWAKARMA MUHALLA, GARROLI	Chhatarpur	Madhya Pradesh	India	471201	27AAAAA0000A1Z5	\N	/uploads/logos/logo-1769142517693-126258508.png	\N	\N	\N	\N	100	t	null	2026-01-23 04:26:48.633	2026-02-09 11:26:13.108	INR	\N	/uploads/letterheads/continuationSheet-1769142583385-342094364.pdf	/uploads/signatures/signature-1769142563754-622063357.png	/uploads/letterheads/letterhead-1769539956229-180044084.pdf	130	60	30	30	130	Applizor Softech Llp	9577002100002551	Nowgong R S Puram Nh-75 Opp High School Play Ground Mp Chatp 471201	PUNB0957700	Punjab National Bank
\.


--
-- Data for Name: Contract; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Contract" (id, "companyId", "clientId", "projectId", "creatorId", title, content, status, "validFrom", "validUntil", "sentAt", "signedAt", "clientSignature", "signerName", "signerIp", "companySignature", "companySignerId", "companySignedAt", "pdfPath", "templateId", "createdAt", "updatedAt", "viewCount", "lastViewedAt", "emailOpens", "lastEmailOpenedAt", "contractType", "contractValue", currency) FROM stdin;
2c3269e5-cbad-43b3-b28e-d613459b733e	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	b5fbcbfd-deb9-421b-9932-fb1420d0562a	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	SOFTWARE DEVELOPMENT AGREEMENT	<p>This Software Development Agreement (“Agreement”) is made and entered into on <strong>26/01/2026</strong>, by and between:</p><p><strong>Client Name:</strong> Arun Kumar Vishwakarma</p><p> <strong>Client Company:</strong> Safalcode Tech</p><p> <strong>Address:</strong> 404 VARADRAJ HEIGHTS\nSHIVTIRTH NAGAR MARUNJI ROAD HINJEWADI PHASE 1, PUNE</p><p> (hereinafter referred to as the “Client”)</p><p>AND</p><p><strong>Service Provider:</strong> Applizor Softech LLP</p><p> (hereinafter referred to as the “Company”)</p><p>The Client and the Company are collectively referred to as the “Parties”.</p><h2>1. PURPOSE OF AGREEMENT</h2><p>The Client agrees to engage the Company to design, develop, and deliver a <strong>self-hosted video news platform</strong> including a website, mobile applications, and Android TV application for the Client’s brand <strong>Peptech Time</strong>, as per the scope defined in this Agreement.</p><h2>2. SCOPE OF WORK</h2><p>The Company shall provide the following services:</p><h3>2.1 Website Development</h3><ul><li>Technology stack: React.js (Frontend) + Spring Boot (Backend)</li><li>SEO-optimized frontend</li><li>Admin dashboard for managing news, reporters, and media</li><li>Multilingual news publishing (Hindi, English, Hinglish)</li><li>Self-hosted video uploads</li><li>Custom HLS video player (Video.js / Shaka Player)</li><li>Live streaming using RTMP + HLS</li><li>Reporter login and approval workflow</li><li>Donation integration (Razorpay / Instamojo)</li><li>Video advertisements (VAST tag support)</li><li>Affiliate links and banner support</li><li>Security (JWT authentication, SSL, secure APIs)</li><li>Performance optimization (caching, compression, lazy loading)</li><li>Regular backups and monitoring</li></ul><h3>2.2 Infrastructure Setup</h3><ul><li>VPS / Cloud server setup (DigitalOcean / Linode)</li><li>CDN configuration (Cloudflare)</li><li>Media storage integration (Amazon S3 / Wasabi)</li></ul><h3>2.3 Mobile &amp; TV Application Development</h3><ul><li>Single codebase using React Native</li><li>Android Phone &amp; Tablet App</li><li>iOS App</li><li>Android TV App with custom layout and remote controls</li><li>HLS video streaming</li><li>Multilingual news viewer</li><li>Push notifications</li><li>User login and donation system</li><li>Chromecast &amp; Android TV playback support</li><li>App Store &amp; Play Store compliance</li></ul><h2>3. PROJECT TIMELINE</h2><p>PhaseEstimated DurationWebsite Development4–5 WeeksAndroid &amp; iOS Apps2–3 WeeksAndroid TV App1–2 Weeks</p><p>Timelines may vary depending on feedback cycles and content availability from the Client.</p><h2>4. COMMERCIAL TERMS</h2><p>DescriptionAmount (INR)Website Development₹60,000Mobile &amp; TV App Development₹60,000<strong>Total Project Cost₹1,20,000</strong></p><p>Taxes, if applicable, shall be charged additionally as per government norms.</p><h2>5. PAYMENT TERMS</h2><ul><li>50% advance payment before project initiation</li><li>30% upon completion of website development</li><li>20% after final delivery and deployment</li></ul><p>Payments must be made via bank transfer or approved digital payment methods.</p><h2>6. CLIENT RESPONSIBILITIES</h2><p>The Client agrees to:</p><ul><li>Provide timely content, branding assets, and approvals</li><li>Ensure availability for feedback and testing</li><li>Arrange third-party service accounts (hosting, payment gateway, cloud storage)</li><li>Comply with applicable content and broadcasting laws</li></ul><h2>7. INTELLECTUAL PROPERTY RIGHTS</h2><ul><li>Upon full payment, the Client shall own the <strong>final developed software and content</strong></li><li>The Company retains the right to showcase the project in its portfolio</li><li>Reuse or resale of source code without permission is prohibited</li></ul><h2>8. CONFIDENTIALITY</h2><p>Both Parties agree to maintain strict confidentiality of all business, technical, and financial information shared during the project.</p><h2>9. WARRANTY &amp; LIMITATION OF LIABILITY</h2><ul><li>The Company warrants that services will be delivered professionally</li><li>The Company shall not be liable for:</li><li class="ql-indent-1">Third-party service failures</li><li class="ql-indent-1">Hosting or CDN downtime</li><li class="ql-indent-1">Content-related legal issues</li><li>Maximum liability shall not exceed the total project cost paid</li></ul><h2>10. TERMINATION</h2><p>Either Party may terminate this Agreement with <strong>15 days written notice</strong>.</p><p> Payments for completed work up to the termination date shall remain payable.</p><h2>11. MAINTENANCE &amp; SUPPORT</h2><p>Post-delivery maintenance and feature enhancements shall be handled under a <strong>separate AMC or support agreement</strong>, if required.</p><h2>12. GOVERNING LAW</h2><p>This Agreement shall be governed and interpreted in accordance with the laws of <strong>India</strong>.</p><p> Any disputes shall be subject to the jurisdiction of the Company’s registered location.</p><h2>13. ACCEPTANCE &amp; SIGNATURES</h2><p>By signing below, both Parties agree to the terms and conditions of this Agreement.</p>	signed	2026-01-26	2026-01-27	\N	2026-01-26 12:11:36.743	data:image/png;base64,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	Arun Kumar Vishwakarma	::ffff:192.168.65.1	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAABkCAYAAACoy2Z3AAAQAElEQVR4AeydCbyVU/fH17ndMg9RVEKGiAoRCQ1CyPBPiErxFhkbyNAgFZo0a5RCFCoNGoiSBhpEGZLofZXmSaXZUP7Pd3f3aT/PPefec2/nnju0+tz17Gnt6fecs9fea619SvpX/ykCioAioAgoAplAIEn0nyKgCCgCioAikAkEVIBkAjStogjEBQFtRBHI5QioAMnlL1CHrwgoAopAdiGgAiS7kNd+FQFFQBHI5QjkYgGSy5HX4SsCioAikMsRUAGSy1+gDl8RUAQUgexCQAVIdiGv/SoCuRgBHboiAAIqQEBBSRFQBBQBRSDDCKgAyTBkWkERUAQUAUUABFSAgEKiSftTBBQBRSAPIKACJA+8RJ2CIqAIKALZgYAKkOxAXftUBBSB7EJA+40jAipA4gimNqUIKAKKwOGEgAqQw+lt61wVAUVAEYgjAipA4gjm4dCUzlERUAQUAYuAChCLhIaKgCKgCCgCGUJABUiG4FJmRUARUASyC4Gc168KkJz3TnREioAioAjkCgRUgOSK16SDVAQUAUUg5yGgAiTnvRMdUdYgoK0qAopAnBFQARJnQLU5RUARUAQOFwQSJkDm/+8nGfTZhDDN/vmHhGC8/99/5Z99+3x9/bR2ZXgcjGnn3j2+8uxMTP9xUXhsw7+clp1Didj3V/9bGh7foM8mCvhGZIySudTDftT8GdJ+7DC569X2cv+gLib+9hefyvY9uyPWos4g57OzIwe9r4gDjiHz733/xMClLIpAzkYgZgFyqNNo9nY/afZO/zA9NKRHhhefjI7hm+W/yHWdWshnPy70VZ277MfwOBjT7zu3+8qzMzH8y6nhsbUc+Xp2DiVi31O+/yo8vmbv9JN9+/dF5Atm7tu/X14Y85Zc3PohqT+ws3Se8K5MXDhX3p/3uYnzeTj7ybqecJoYrCrzPaHVzPnsbNq+LRVPbslYt+13Ya7tPQGaW8as41QEoiGQEAHy7W//lUUeuYNYvmmdzF76vZsVt/i23TvlkTd6yVUdmsgcT1jErWFtKNMI3NPvRek68b0063OyaOYJpXfnfJYmX24t7PnxaCnRvK5w2sqtc9BxKwIuAgkRINFUMW/M/NgdS9ziP65eIW/OmhK39hLZUNGCJ0vJIsUNXVjsjER2nWV9oTKc6J023A6uK32pdLjzAflP5Zuk8PEnukXyn8GvCMLEZp5w9DEGD4vLkfnz26JcE3ICazVySCbHq9UUgZyJQJYLkN1//SlvRVnMUV/kZnVEVrzSjnc3ksVdhhr6tGW3rOgi4W1+8v0CX5+z2vaWj57pLC1vqyODGj4pv3R/O5UQ4dRqK9W87GqDh8WlWMFCtkhDRUARyEYEslyATFo017ebvOa8Mr7pRlNX/G/DWqnVu12YvvbsGW7F3zZvCJfBN/e/S0xxe0+3/Ox7r5m4fbTzdO/wjIiiGvnXM7RzSrq95/NS6JGacvZT9YyePqh2s+0Rbty+Vbp4Kpkr2z1u6hzxwI3G3vL0u4Nk5e8bYfERCyJjgDAer96ySeoN6Gjq0sbL44cbm1DfT8eF54UajkZwAqAOddMjDNTUsbR1105pPWqoXNvxKWGMzK1u/44SDQtbj3YsHsWb3iPUwRHClmckDOKxI2AsP7rAEfKidxrhhFHuzHOlSqmL5A9PDWn7+HzJojAmzB/sbZkNxyyYJTV7tTV4Ml5OMagvMfpTBwJDa/Rfs2Wzr81NO/6QmT99Jw8O6W7eP5+DGt1aRVU3sTF6/fPJBlf6A1vqlHrmAWky7FXfZ2D0/Jly96sd7FBN+N7c6ab/594fbNLuA4Fb13tHvCvaLeW1yWcF1RefVZeXON8h5gdhZ+K7UL3LM+Z939qjjTR6vZvpi3KIzx71XPro2/k+nsWrl7vFGlcEIiKQ5QJk6Ay/mmr4Y619AxkYxZNny64dMvnbeWHa8McWX70/9uwKl8G3buvvpnzOL4slIGyM/QWeJWtWGJ7gg8WGLxlfXFQnLC4soCzs0xZ/E2QXyiu/9KQgmBAy1IHpi18WCwKgZIv6qVRom70FijFAEz11zk2vtJQPvpplhCttIGiTQiFZtGJZeF6TvPnT7r5/9xuDM3XTo2Xr11DFEItn2VaNpMdHo8K2IMbOYtvQUxPd2+8lAUfDnPJA1YKRF0O3xYNTInUqv9Rc3pr9SQpn7MGlJUr6mG/p3trYqD7+7iszfwobVrnZnDLmdegvnLxuLVeRbEMrf98UxoT579y71+TzQCA89mZvI+Bse4yXRRWh2d2bO3UgcLcLMPMmz1L3ySOletdn5Z0vppr3u2PvHuN8ARbPBhZ5hEdNb7PxhCcoEFL0x1ios9yz7Q32BAv2tx9WHViEl21YbcYPjyXeA30jtGwe4SuT3hcEN3jDQx5t8llhLGBn8ymDlq5bZdqnvQFTx0vVl5+UmSn2xak/fG3eMWWWxn/9BdV8NGj6xHAb8J19SjFfuSYUgUgIZKkA4RQx46dvw/0+UOlGKXriyVL/mhvCeXw5ssqYHu4kncicFEN7UBdPNYQEoaV1236X6zo/Lcu9hcLmRQo5PbCgRSojb9n61QRhut/DJpyIQ4RFrlafdmIXt0hNjvMWkk4fjvAVITjZ6bqZ4HLckUeZrODiZTLTedxYtnwqFRU2KntiuLHrc9J7yhhZFeHklk7TnhCeKUMDtjR3vB9+82V6TZhy+jeRCI8+3tjceeNSbBdoy87pyWJEHrh3GDeMaMzEGNp+8Gaa/HgU1u7bIZVruq2EELNxGz5T4x5xx/aed/qxZYRs1tgsEIcerFpDOBUSV1IE0kIgSwUIaiG38zpXVTPJelddZ0L7GDLjIxs95PCNxs/K6w+28LXTp/4T8n3nIfLkTXf58t3El+36yupXR8r6/mOMwdaWcZrZ6qmBbPqhoT19wgMj8Ire78rGgWOlT/3HLZsJHxraw+z+TCLCo0n1O+SdR1sJeNQsf7VE+1cgX7J81rqHTPVsIhBx6KzCRX1VTjupkPDlJ5NFj0WMONT69npmboy1doWqZBli0UIokkBV1mb0UKJhGtnkhTAuj13/f+H8jERY0Ec86j95uvXZZKDKOdc7uTXxdvWMwy2PFocv6Oo8tnmH8HjBN1rdSPmvNmgiO4dOlh1DJsuNF13uY/lxzcHTKycZW3hBsTNk08Bx5vS00vv8MFdbttA7TRJ/5LrbZeHLfrVqg2uqm8/kqKbtYBHUTmBgEt6DdiY89bJsGzzB1K1wzgVe7oE/PpMDpn14IBHl2fu+x2XAf5obJ4UK517gbdqqhzmpjwrYZgQ3OnUC30/Ll6lQK+VpBLJMgPDlfn3G5DB4fCEqnX+RSVcudbFvR8quN5Je2zBn8FH8pMJyTuD4fVbhInJ+0dOl0HEnRGytW52HpfxZ55mygsccK408dYpJpDy2euo0oiu9HTIqAeLQVSVLy0DvS8qp6oSjjhEWirY161NkiAV8xpJvTTz4YEGgXxZzhB5tBHlsOhQKCbajyp5tACI+zVOtuacgdpiTn+4sp55Q0FRzd96Utbq9rjA3+mnzf/UMj31Y3jVbNxv1jc1HGNX0DNikk/Plk873POh7b+THSlUuuFh+7jZMmG9adVD/3Nv/JeEElRYfZcHxNr72FrnlkispEjtehKrJSOfxf948H652q+T3hHWB5GR5ukZtX43NngrSZnzepqdsGDBGZjzfSya26CjHH3W0KcK2c4lnwzEJ77F99y7vKXLSMcdJKU/QmETK45QTTjSfyTNOPsXkDPdUZyaS8nj74ZZGiB3l2YdKFy8h45580XeKSMuD8bnb6sij199uPsc4KdDkfVdfTxAm+87JGOOpUgkh8OJzTVxJEUgPgSwTIFO9BY4F1A6gVvlrzE1jdvPbPSPqXVdUtkUmfHfOdBPG+ti/f3+srOnyXXjamT6ek4493pf+65+/TRr3YBNJeTzoLVihUCgldSAIflHdnesBjgPP2hWqSCjkr3ugJP0nJzYu4rmcY5p1EHbD5KHnx65C3BLqFE4X0DtfTrXZJlzlGfSJuLtS0rjaElo6Mn8BuaHMZTaZ4bCEJ8g5cbFjf/fxNmZ3zMYi2BA7fDYVwfxgOjjeqhde4mNBGNxycQVfXrREpfPL+oqKnHiSL73n77986ROPPlaKeerYzz0VLerKMi0byRnN7hV3gxFJneRrxElw6dUmwaRa6XI2acKTvc/kXVdUMXEeuEbvDYyJfOgO77tG6NJl3gbJfj7Ix0ZEyPcRmwdxqGHlmwVbHHElRSA9BLJMgAyd6VdLvTZ9khR5/M4wDZw2wTe2QVGM6ZYJ466NE/4d+HkS8jJLnFrcuvm93babtnF7ErHpU48/0UbDITu4cMKL/NcxanvJ8N/pKTvPcEbESOpMdNWPv9XHV8AJhh2+zXR3y+SxkHWfPEpcIt/S2hQHhHWefcfmEbJIErp0SoQ5u+XR4nv++tN4JrFgsWO/8/LKxoUXteF8z3B+g2cncevO+uk7NxkxzgnELTj2iKPcpIkXOi71OzIFgQd3TdysAt5JxE27cRbuhoNfkfOebmBulWPPCdq04OfkRxgLbdxx8Hb92QHVpK0f/MxwIrZlblg8ipszJ0rLxwbj143r5NMfFtgsE9a+sqoJ9aEIxIJAlggQFiJ2kbEMwPKgjpm1NPqi8Xfgt4P4Etu6hxqiJnDbCIVCbjIcZ+ELJ7wIJykv8P1t2bnDlz7NU6n5MlISxxxxZEos9gBXYDx03Bov3NHA2FDcvGNSDN42j4UM1U40OvfU0wxr4cBiu/uvvSbfffyRopZx89KK/7J+tXGtPbHx7VLSs3F0/HB4KnbUPuOb+1U0n3on2FSMgYzCAZUkxuAAi6z11HLBvEjpI5Lz+7KTkqJ/NRoM6uJzg8aA3vymO2WsZ3/BJuZrKMYEai7LGmkelAU3BkW9ExD5QQp+nm15UDigxhqzYLYtFtSq5xUpHk5rRBFID4Ho35L0aqZRHvTySIPVV+S6/B6R3/+FDi5c0XZfvgZTErh6pkQPKQieVDgNBBvES8bNK1O8hJsMxwsEFqxwQZTIKs/+gk+/W8xi1dqzbbh5xPGgQQ1CHDr+6GNkTLP2ZoFjkfvAi3eq3UhwqSZtbSJnFjoV9jBh2A0nvAinQFyVvWjMf8HdNJdKXdWmbSgzG4Lg+2BBtO0R4qo7ZsEsoulSKBR50xCsyM/kuP1gO/mh8xDpem9jY3+JVf3z77/+ll23WU4zeDC6HGygXGP3aScV8tlEXN5on61Tji8ojNfy9p06Tty5NKh00NBueQ7nUOeePgJxFyAs1oOnHzSeM4Qfugw1njGoK1xa1uMdisOE3tsa00sUKhLOJzJp0TwCQ6hBXhrnr2sKUh4YUFOiJrCqJwz7JiOTj4vPOEf44trq3IngkphNc/kqeGfg6sDFScubLyl26Fm0buvRxueSiz676Y21ZNmGNcIu39KKTetNF9decNAegAvqrJR7ARS+QltywgAAEABJREFUP3e6+VHDgt6pgEtq9lIhKhJOK/BAr3lqxYUpnkSk+08dLyxuxGMl3kX1sgc9mlCn3dytpYDdhj+2CvaaJWt+k9p9XwzfCaHtWAy57PzPctQ9uCVzD2e3py7DPsJdFvqjvXgRtge3LT4TodAB4cN8+Ay75TaeL8n/vrek/ICn/UxaZwXL33hoD7E/8glPm9Fv+Lz/apWvZFlThfmS/H25DPc7QoLPhVsWyXbilmtcEQgiEP2TFuSMMf3lL4t9H3TUJhyL2REHCQ8UVy9LF9aYjroIfvKgyd/OE27XYrDkchwqL/IjUVA91PTtvoKR8+n3BkVijzkvFAoJ7pFuhfsGdpJLWj9kbiRf9vwjvkW+e91HJLhLduvGGh826xMJLlyky7VpLGU9461L1Tq3MM22qHG3Ce2DS3JPDh9gLvBxcdLmg+PVJUubZIHkZHn57oYmzoPFt2L7J8wNby7lPRO44Q9PLGRPOJaXC3YPD+1pjM5H/ucmYR7BkxsqIcsfLcyXlCTP3Xavr5hfAkAwYp+IdEL0MWcicVZgY9Pr49HC3Y0OY9+Wih2e8AlB8OPkYLtxhTN2kyvbPS7l2z5iimt6hm+860zCe3DSO9+zsXBHpsSTdQW3bC/b/PG9aHtHfRPP6OOGMuUjnlywSWGoz2h7yn94IxB3ATIscFO53tXXpYnwfc6lQhhdY/ozAVfKmd4umi/epu3bjL4W/kiEy677ZeWLzM555eaNkdgzlHf7pVfJOE9f71ZiMZ+TchnR5nO349HrbrfJQwo51WW0AewKCDC33oBpH6a6Ic8dGbyjLF/DKjVSYYvqxM6PXb/lTTN0CnFDxdDvZEWN8t5wjY3lBEIjXE5tEfickA/Rlrsok3eohHfWXY4HIZ8tbo93mjDC5wJt+3FPcO5JjHIM2Xx2OIWhdpzQoqNcV/pSigzRNndk+LybDO/BnEY+0VZwG/eSGf4rkJwsjavdlqpeet/TVBU0QxHwEIirAEF1wE9BeO2G/25Ox43yynMu8F3cW75pndjfXGrmGSb5xVa+NLZB4o2q3CxTnutqs0zoGj1x3xz2SMtUOy3UKTC7vCbtnSwILeVL8sMS5K9xSQVzqY+FhN2grUfIAjuyyQvCgmn7Iz8plHab8ED5kvIRGCqQnGzCWPXqhtl5cJFuyrNdhN+XcrJNtOzpZ8nopu3kkev8i0mB5GSZ2qqbPH5DTcNnH8yTi5K973vMZpkwJCETpvdAoP7gqTLBLBIv7XNa5UJn9bLlfSyB1+NzMw2FQoI9B7zR7/P5QK3FnZD5HQbIlSUv9LWVL+nAewhiGgrMI1jupvs/0My4IPsa9hLYpJb38t/sn7Bwjldy4K/9nff7PuvkMu9dfx5wVuDkjK2q9e31wveS4LEEhku7DZOgWjRf4LNl+aOF91a81lcEZteXybx7tq8xTRxWCBz4NsVpyuyi/nzrE3GJvLSaD4VC5havW6fiuQe/9Pxi68aB4+S7Tq/LNy8Pkg0DxpobtrTr1gnqkFmM1vb7wNSZ276fbB08QUZ5CztjeaDSjb4xovsn3xKX3dy2UcHZMhtyoW/EY21kVZ/3ZUnXN4WFb/Og8WYuwbFQp1rpcr4+3TlSbolb9LbvX3uOMNkI0j8DuEZL2zqmove49sJyMq9Df9k+ZJJ8/dIgmd22j3AbfcGLA4XTlMeS6g+PpJ71HhVuZeNiy8LPPLkoyULj9u0KyVQNBTLAEcx2Df1I/tdzuHAh74sXXjW3+LGNjW3ewVyuC1QTbm27fbonJuw3qKou8exTgxs9JbyDpd3ekr73N5VzTi0mG/846B7LYm3bLlXsDN/7uLtCFVtkQlSPbp8IB1PgPXBv5oLe+v5jhM8WuHJ7nTx+Kditx68re1XMH/PnFxEY34zne8nafqONbfBYx2sOD6p2tRqYz9Pv3udpVtveAv+eN6eYTUmky7Dwu33mS0r7ax000Dfwvg+8czNIfeQFBBI2h7Q/aQkbRtodJXlChi98meJnSb6k2IdcIDlZqHNpiZJZ9ts+oVDILFTcZGcnl/ZMsq+UBYJTxxXnlJKiJ54soVAo3cFwkkMVxsIXCqXPn26DKQwIHRZo1FSXn31+ptUxNMfPf+DafOnzD8upj90pqNvIh35et0rGfT2bqCHmYiJxehQ85li51PtsgWuB5OSYWuWzfJZn+GcDkZ7NAcGCay381IupgzSYUJVho8Rm47LVqVjNTWpcEYgZgdhX45ibVEZFIHEIuN5m9FqzV1vBs6x403vkolYP+ozaDSvfBMthSTh6FH70DqnWqYXPk65KqYsEIX5YgqKTPmQEVIAcMoTaQHYi8Eqdxql+nws7mmt4Zny3XVpRal1eiWi6lBcZCh5znE+Y2jl2rfOwjWqoCGQYARUgGYZMK+QkBIp66rgfOg8VfugRNaJr50D1w6/q4tQwukm7nDTshI+lnKdqs52iakWgzmnXN6KDheXTUBFIDwEVIOkhpOU5HoGCni3iqZvvNoZnjPEY6SGMz/wkOk4NoVD8bDg5HpAIA8QpAkM7zhQ4GnzQtL3wA4sRWDVLEYgZgfgLkJi7VkZFIGsQwEgPZU3rubtVnCly9wx09DkJARUgOelt6FgUAUVAEchFCKgAyUUvS4eqCKSDgBYrAglFQAVIQuHWzhQBRUARyDsIqADJO+9SZ6IIKAKKQEIRUAHiwK1RRUARUAQUgdgRUAESO1bKqQgoAoqAIuAgoALEAUOjioAikF0IaL+5EQEVILnxremYFQFFQBHIAQioAMkBL0GHoAgoAopAbkRABUhufGupx6w5ioAioAgkHAEVIIcI+b59+2T9+vWyatUq+fvvv9NtbePGjYb3r7/+Spc3LQb+b4dNmzbJ/v3702KLW9mff/5pxs340+tz9+7dsn379qh9ZxdmUQekBYqAIpApBOIuQFgcypcvL5Zq164tzz//vCxbtixTA7SVFi5cKH379k1zYbK8iQgRFi+99JJUqFBBbr31VrnjjjukYsWK8uqrr0YUJB999JFUr15datSoYXivuuoq+e6779Ic6qeffmpwnD59uo9v7NixUqVKFbn55pulatWqMnjwYF85CRZ56tWpU8e0MWbMGLLTpWCfq1evlubNm8vVV19txs346XPixImp2tq6das8/PDDUrlyZalWrZrQN4LVMiYCM9uXhopAwhA4jDuKuwCxWJ5yyimC8Dj55JNlypQpZjGZNm2aLc5w+NNPP8mwYcNk165dGa6bFRVYDD/88EO58MIL5bHHHpPGjRvLSSedJG+//bYht0+ExwsvvCDJycny6KOPynPPPSfXXHNNmsKQE8abb74p4IiwsO198cUX0qlTJylSpIhp5/zzzzcCZPTo0ZZFOJnce++98uyzz4YF9z///BMujxaJ1OfKlSuFPhnDU089JbVq1RJOGB06dBCEum2Luk2aNJFvvvlG7r//foMJm4ZGjRrJ3r17DVtWY2Y60YcioAgkDIEsEyDnnHOOWcAGDhwob7zxhhx99NHyyiuvSDTVDQtQwmYdh47y589v5oNQa9iwoREgr7/+umnZ3e0zryFDhhjhAg4sqHfffbf07t3bCBFTIcJj/vz5ZvF/4IEHJF++fGEOTh8kevToIbTTpk0bkvLee++ZkMeWLVvk119/lbp16xphQ14sFKnP008/Xd555x2hP9pr3bq1IAxpj40BIYSAX7p0qdx2222CIAETTlyMZc6cObBIVmNmOtGHIqAIJAyBLBMg7gwuuugis9ixmMyYMSNcNHv2bGnatKlReVx++eXmlDJ06FBBDWaZUBOx6I4YMcJkPfPMM0IasguTKfAe7JYpR4UCNfdUL64KxWMxfyyuDz30kEBfffWVycvog8UQNU0odPD/mTjzzDPltNNOE9dO8OOPPwrjuueee8ypwe0nFDpY180njmBC6LIgk4b27Nkjs2bNkosvvlhY2MlDKBHSx2+//UZUihYtKpyOODFwAjSZMTwi9Uk/F1xwga/2lVdeadLr1q0zIQ9OKYSo1QjBGHUYcfvOI2MWP8zoS0kRUAQSh0BCBAjTQedPuGLFCgJDn332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	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-26 11:46:28.278	\N	\N	2026-01-26 11:46:01.428	2026-01-26 12:37:07.791	7	2026-01-26 12:37:07.79	0	\N		50000.00	INR
\.


--
-- Data for Name: ContractActivity; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ContractActivity" (id, "contractId", type, "ipAddress", "userAgent", location, "deviceType", browser, os, metadata, "createdAt") FROM stdin;
563d2f74-6ebe-4d0e-9595-56a19c5c68da	2c3269e5-cbad-43b3-b28e-d613459b733e	COMPANY_SIGNED	::ffff:192.168.65.1	\N	\N	\N	\N	\N	{"name": "Admin User"}	2026-01-26 11:46:28.28
4772bac8-cb10-48f6-9bbb-60f71cc0a919	2c3269e5-cbad-43b3-b28e-d613459b733e	EMAIL_SENT	\N	\N	\N	\N	\N	\N	{"recipient": "arun1601for@gmail.com"}	2026-01-26 11:47:18.445
32ec46c8-6449-4add-a3e5-81d4b98270cd	2c3269e5-cbad-43b3-b28e-d613459b733e	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	\N	\N	{}	2026-01-26 12:11:16.027
b8c4fcb3-9a0c-47d4-a3cf-c5617380150b	2c3269e5-cbad-43b3-b28e-d613459b733e	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	\N	\N	{}	2026-01-26 12:11:16.065
c9d5910d-4562-4a22-82ed-38eaeb0d536d	2c3269e5-cbad-43b3-b28e-d613459b733e	SIGNED	::ffff:192.168.65.1	\N	\N	\N	\N	\N	{"name": "Arun Kumar Vishwakarma"}	2026-01-26 12:11:36.744
027cd198-3281-4b6b-9bda-4dd975b817a5	2c3269e5-cbad-43b3-b28e-d613459b733e	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	\N	\N	{}	2026-01-26 12:11:47.518
5c14ee7e-8d62-4c50-8445-ac6711bca5e2	2c3269e5-cbad-43b3-b28e-d613459b733e	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	\N	\N	{}	2026-01-26 12:11:57.372
de4d417d-f28f-4324-9eb1-04a760cf1fd3	2c3269e5-cbad-43b3-b28e-d613459b733e	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	\N	\N	{}	2026-01-26 12:11:57.394
96feb59d-76ff-4965-b457-2061615f48fe	2c3269e5-cbad-43b3-b28e-d613459b733e	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	\N	\N	{}	2026-01-26 12:37:07.74
83765962-19b2-442c-b5e5-0598cc8bf6e1	2c3269e5-cbad-43b3-b28e-d613459b733e	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	\N	\N	{}	2026-01-26 12:37:07.785
\.


--
-- Data for Name: ContractTemplate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ContractTemplate" (id, "companyId", name, description, content, "isActive", "createdAt", "updatedAt") FROM stdin;
3028064f-bbf1-4b39-829b-6acea09fd601	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	SOFTWARE DEVELOPMENT AGREEMENT		<p>This Software Development Agreement (“Agreement”) is made and entered into on <strong>[CURRENT_DATE]</strong>, by and between:</p><p><strong>Client Name:</strong> [CLIENT_NAME]</p><p> <strong>Client Company:</strong> [CLIENT_COMPANY]</p><p> <strong>Address:</strong> [CLIENT_ADDRESS], [CLIENT_CITY]</p><p> (hereinafter referred to as the “Client”)</p><p>AND</p><p><strong>Service Provider:</strong> [MY_COMPANY_NAME]</p><p> (hereinafter referred to as the “Company”)</p><p>The Client and the Company are collectively referred to as the “Parties”.</p><h2>1. PURPOSE OF AGREEMENT</h2><p>The Client agrees to engage the Company to design, develop, and deliver a <strong>self-hosted video news platform</strong> including a website, mobile applications, and Android TV application for the Client’s brand <strong>Peptech Time</strong>, as per the scope defined in this Agreement.</p><h2>2. SCOPE OF WORK</h2><p>The Company shall provide the following services:</p><h3>2.1 Website Development</h3><ul><li>Technology stack: React.js (Frontend) + Spring Boot (Backend)</li><li>SEO-optimized frontend</li><li>Admin dashboard for managing news, reporters, and media</li><li>Multilingual news publishing (Hindi, English, Hinglish)</li><li>Self-hosted video uploads</li><li>Custom HLS video player (Video.js / Shaka Player)</li><li>Live streaming using RTMP + HLS</li><li>Reporter login and approval workflow</li><li>Donation integration (Razorpay / Instamojo)</li><li>Video advertisements (VAST tag support)</li><li>Affiliate links and banner support</li><li>Security (JWT authentication, SSL, secure APIs)</li><li>Performance optimization (caching, compression, lazy loading)</li><li>Regular backups and monitoring</li></ul><h3>2.2 Infrastructure Setup</h3><ul><li>VPS / Cloud server setup (DigitalOcean / Linode)</li><li>CDN configuration (Cloudflare)</li><li>Media storage integration (Amazon S3 / Wasabi)</li></ul><h3>2.3 Mobile &amp; TV Application Development</h3><ul><li>Single codebase using React Native</li><li>Android Phone &amp; Tablet App</li><li>iOS App</li><li>Android TV App with custom layout and remote controls</li><li>HLS video streaming</li><li>Multilingual news viewer</li><li>Push notifications</li><li>User login and donation system</li><li>Chromecast &amp; Android TV playback support</li><li>App Store &amp; Play Store compliance</li></ul><h2>3. PROJECT TIMELINE</h2><p>PhaseEstimated DurationWebsite Development4–5 WeeksAndroid &amp; iOS Apps2–3 WeeksAndroid TV App1–2 Weeks</p><p>Timelines may vary depending on feedback cycles and content availability from the Client.</p><h2>4. COMMERCIAL TERMS</h2><p>DescriptionAmount (INR)Website Development₹60,000Mobile &amp; TV App Development₹60,000<strong>Total Project Cost₹1,20,000</strong></p><p>Taxes, if applicable, shall be charged additionally as per government norms.</p><h2>5. PAYMENT TERMS</h2><ul><li>50% advance payment before project initiation</li><li>30% upon completion of website development</li><li>20% after final delivery and deployment</li></ul><p>Payments must be made via bank transfer or approved digital payment methods.</p><h2>6. CLIENT RESPONSIBILITIES</h2><p>The Client agrees to:</p><ul><li>Provide timely content, branding assets, and approvals</li><li>Ensure availability for feedback and testing</li><li>Arrange third-party service accounts (hosting, payment gateway, cloud storage)</li><li>Comply with applicable content and broadcasting laws</li></ul><h2>7. INTELLECTUAL PROPERTY RIGHTS</h2><ul><li>Upon full payment, the Client shall own the <strong>final developed software and content</strong></li><li>The Company retains the right to showcase the project in its portfolio</li><li>Reuse or resale of source code without permission is prohibited</li></ul><h2>8. CONFIDENTIALITY</h2><p>Both Parties agree to maintain strict confidentiality of all business, technical, and financial information shared during the project.</p><h2>9. WARRANTY &amp; LIMITATION OF LIABILITY</h2><ul><li>The Company warrants that services will be delivered professionally</li><li>The Company shall not be liable for:</li><li class="ql-indent-1">Third-party service failures</li><li class="ql-indent-1">Hosting or CDN downtime</li><li class="ql-indent-1">Content-related legal issues</li><li>Maximum liability shall not exceed the total project cost paid</li></ul><h2>10. TERMINATION</h2><p>Either Party may terminate this Agreement with <strong>15 days written notice</strong>.</p><p> Payments for completed work up to the termination date shall remain payable.</p><h2>11. MAINTENANCE &amp; SUPPORT</h2><p>Post-delivery maintenance and feature enhancements shall be handled under a <strong>separate AMC or support agreement</strong>, if required.</p><h2>12. GOVERNING LAW</h2><p>This Agreement shall be governed and interpreted in accordance with the laws of <strong>India</strong>.</p><p> Any disputes shall be subject to the jurisdiction of the Company’s registered location.</p><h2>13. ACCEPTANCE &amp; SIGNATURES</h2><p>By signing below, both Parties agree to the terms and conditions of this Agreement.</p><table style="border-collapse:collapse;width: 100%;"><tbody>\n<tr>\n\t<td style="width: 50%;"><p><strong>For the Client</strong></p><p>Signature:&nbsp;[CLIENT_SIGNATURE]</p><p> Name: [CLIENT_NAME]</p><p> Company: [CLIENT_COMPANY]</p><p> Date: [CURRENT_DATE]</p><br></td>\n\t<td style="width: 50%;"><p><strong>For the Company</strong></p><p>Signature: [COMPANY_SIGNATURE]</p><p> Company Name: [COMPANY_NAME]</p><h2> Date: [CURRENT_DATE]</h2><br></td></tr></tbody></table>	t	2026-01-23 04:46:38.525	2026-01-26 08:42:37.812
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Department" (id, "companyId", name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
a9e50298-d5db-4b87-8ab6-a8e12194321d	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Engineering	Software Development	t	2026-01-23 04:26:48.808	2026-01-23 04:26:48.808
80f8b173-8253-4dff-be66-3b8229770117	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	HR	Human Resources	t	2026-01-23 04:26:48.824	2026-01-23 04:26:48.824
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Document" (id, "companyId", "clientId", "invoiceId", "employeeId", "projectId", name, type, category, "filePath", "fileSize", "mimeType", version, "isTemplate", tags, metadata, "createdAt", "updatedAt", "taskId", "rejectionReason", "signedFilePath", status, "uploadedById", "workflowType") FROM stdin;
56a3dc63-8438-44b4-8ff6-54e515295d66	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	\N	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	\N	Contract-SOFTWARE DEVELOPMENT AGREEMENT (7).pdf	document	\N	/uploads/documents/file-1769431869789-660654956.pdf	76130	application/pdf	1	f	\N	\N	2026-01-26 12:51:09.814	2026-01-26 12:51:09.814	\N	\N	\N	approved	\N	standard
452964d8-de84-407b-b2fa-37aef0b69827	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	\N	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	\N	a62d36b5e828c380ac280eb549e24e13.png	document	\N	/uploads/documents/file-1769432873584-321057975.png	50939	image/png	1	f	\N	\N	2026-01-26 13:07:53.627	2026-01-26 13:07:53.627	\N	\N	\N	approved	\N	standard
1e9f7480-a0af-439f-b5d9-98a8a4127cae	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	\N	\N	9aa9231b-55ed-4db9-91f8-f64014040d50	Screenshot 2026-01-27 at 9.34.33â¯AM.png	project_file	General	uploads/1769536890976-374137548.png	452062	image/png	1	f	{}	\N	2026-01-27 18:01:31.005	2026-01-27 18:01:31.005	\N	\N	\N	approved	\N	standard
6a3b5f36-f967-4c2c-ab32-7cf932e8f391	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	\N	92f82430-03a8-4ea2-bd52-76d52f439c8d	\N	applizor-logo (1).jpg	General	\N	/uploads/documents/sapplizor_applizor-logo_(1).jpg_1769760058545_applizor-logo (1).jpg	83936	image/jpeg	1	f	\N	\N	2026-01-30 08:00:58.548	2026-01-30 08:06:09.707	\N	\N	\N	approved	1baee587-356c-421c-8df7-cd0c2ceefea7	standard
de73604d-3f81-40da-b4db-127e378e458b	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	\N	92f82430-03a8-4ea2-bd52-76d52f439c8d	\N	offer letter - 1/30/2026	Offer Letter	\N	/uploads/documents/sapplizor_offer_letter_1769760167577.pdf	350739	\N	1	f	\N	\N	2026-01-30 08:02:47.604	2026-01-30 08:07:27.151	\N	\N	/uploads/documents/signed_offer_letter_-_1_30_2026_1769760436349.pdf	approved	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	signature_required
4bfff210-045c-4807-92da-8158f8dd284c	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	ba44724c-4300-4993-bd22-c151c1e8527a	\N	\N	\N	pan	Onboarding	Onboarding	uploads/1770120453330-954486443.png	3975806	image/png	1	f	\N	\N	2026-02-03 12:07:33.64	2026-02-03 12:13:15.948	\N	\N	\N	approved	\N	standard
\.


--
-- Data for Name: DocumentTemplate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."DocumentTemplate" (id, "companyId", name, type, "filePath", "isActive", "createdAt", "updatedAt", content, variables) FROM stdin;
d4ad214c-5a30-4761-afe4-d1833176cad2	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	offer letter	Offer Letter	\N	t	2026-01-30 07:50:13.596	2026-01-30 08:02:05.007	<p class="mb-2 leading-relaxed text-sm"><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">[DATE]</strong></b></p><p class="mb-2 leading-relaxed text-sm" style="text-align: justify;"><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Dear [EMPLOYEE_NAME],</strong></b></p><p class="mb-2 leading-relaxed text-sm" style="text-align: justify;"><span style="white-space: pre-wrap;">We take great pleasure in inviting you to join the family of</span><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;"> [COMPANY_NAME].</strong></b><span style="white-space: pre-wrap;"> Your terms of employment would be as follows:</span></p><p class="mb-2 leading-relaxed text-sm"><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Designation&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : [DESIGNATION]</strong></b></p><p class="mb-2 leading-relaxed text-sm"><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Annual Cost to the Company&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; :&nbsp;Rs. XXXXXX</strong></b></p><p class="mb-2 leading-relaxed text-sm" style="text-align: justify;"><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Date of Joining&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : [JOINING_DATE]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</strong></b></p><p class="mb-2 leading-relaxed text-sm" style="text-align: justify;"><span style="white-space: pre-wrap;">In case you need any further information on your job profile, salary, or any policy, please contact the undersigned. This is a letter of offer, and your formal letter of appointment shall be provided on your completion of the joining formalities. As a part of the joining process, you are requested to bring the following original documents on the day of joining.</span></p><p class="mb-2 leading-relaxed text-sm" style="text-align: justify;"><span style="white-space: pre-wrap;">The offer of appointment is subject to satisfactory completion of your reference check and verification of the documents submitted by you.</span></p><p class="mb-2 leading-relaxed text-sm"><span style="white-space: pre-wrap;">List of documents to be submitted along with a self-attested copy each:</span></p><ul class="list-disc ml-5 mb-4 space-y-1"><li value="1" class="pl-1"><span style="white-space: pre-wrap;">Birth certificate / SSC Mark Certificate / School Leaving Certificate / Transfer Certificate</span></li><li value="2" class="pl-1"><span style="white-space: pre-wrap;">3 passport size photographs and soft copy of passport size photographs</span></li><li value="3" class="pl-1"><span style="white-space: pre-wrap;">Proof of Residence.</span></li><li value="4" class="pl-1"><span style="white-space: pre-wrap;">Highest qualification certificate along with mark sheets.</span></li><li value="5" class="pl-1"><span style="white-space: pre-wrap;">Relieving letter from the previous organization or Accepted Resignation letter.</span></li><li value="6" class="pl-1"><span style="white-space: pre-wrap;">Experience letter/ Form 16 (Income Tax) from previous employer (if applicable)</span></li><li value="7" class="pl-1"><span style="white-space: pre-wrap;">Salary Slip of last three months of the previous Company.</span></li><li value="8" class="pl-1"><span style="white-space: pre-wrap;">Pan Card.</span></li></ul><p class="mb-2 leading-relaxed text-sm"><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">We look forward to you having a long and fruitful relationship with [COMPANY_NAME].</strong></b></p><p class="mb-2 leading-relaxed text-sm"><br><span style="white-space: pre-wrap;">For </span><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">[COMPANY_NAME]</strong></b></p><p class="mb-2 leading-relaxed text-sm"><br></p><p class="mb-2 leading-relaxed text-sm"><br><span style="white-space: pre-wrap;">Authorized Signatory</span></p>	{DATE,EMPLOYEE_NAME,COMPANY_NAME,DESIGNATION,JOINING_DATE}
\.


--
-- Data for Name: EmailTemplate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmailTemplate" (id, "companyId", name, subject, body, type, "isActive", "createdAt", "updatedAt") FROM stdin;
a324cbe4-f576-48b8-bec9-eadb35a96b71	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Offer Letter	You application at Applizor Softech LLP	Hello {{firstName}}, {{lastName}}, {{jobTitle}}	offer	t	2026-02-05 15:16:08.487	2026-02-05 15:16:08.487
\.


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Employee" (id, "companyId", "userId", "employeeId", "firstName", "lastName", email, phone, gender, "bloodGroup", "maritalStatus", "dateOfBirth", "dateOfJoining", "currentAddress", "permanentAddress", "emergencyContact", "bankName", "accountNumber", "ifscCode", "panNumber", "aadhaarNumber", "departmentId", "positionId", "shiftId", salary, "salaryStructure", status, "createdAt", "updatedAt", "createdById", "employmentType", "hourlyRate", "noticePeriodEndDate", "noticePeriodStartDate", "probationEndDate", skills, "slackMemberId", "probationProcessed", "candidateId") FROM stdin;
4a00d49b-a4d8-4282-a0b4-4e5bf3456419	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	EMP-0001	emp1	EMP	applizor1@gmail.com		Male		Single	1998-04-01 00:00:00	2026-01-26 00:00:00	Bhopal madhya pradesh india	Bhopal madhya pradesh india	\N						a9e50298-d5db-4b87-8ab6-a8e12194321d	020858a5-3766-4388-99cb-39f9af2c2879	\N	\N	\N	active	2026-01-26 12:40:38.733	2026-01-26 12:41:01.116	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	Full Time	\N	\N	\N	\N	""		f	\N
92f82430-03a8-4ea2-bd52-76d52f439c8d	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	1baee587-356c-421c-8df7-cd0c2ceefea7	EMP-0002	sapplizor	sapplizor	sapplizor@gmail.com		Male	\N	\N	\N	2026-01-27 00:00:00			\N						a9e50298-d5db-4b87-8ab6-a8e12194321d	020858a5-3766-4388-99cb-39f9af2c2879	\N	\N	\N	active	2026-01-27 14:22:53.708	2026-01-27 14:22:53.708	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	Full Time	\N	\N	\N	\N	\N	\N	f	\N
fb701cd7-2dbf-4d59-9283-da19fd06c404	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	EMP-0003	testing	visk	jugal963075@gmail.com		\N	\N	\N	\N	2026-02-05 16:36:05.947	\N	\N	\N	\N	\N	\N	\N	\N	a9e50298-d5db-4b87-8ab6-a8e12194321d	a72f4ce6-57e9-4128-900a-cf04e5d0d299	\N	\N	\N	active	2026-02-05 16:36:05.948	2026-02-05 16:36:05.948	\N	\N	\N	\N	\N	\N	\N	\N	f	3b85cac7-1dea-4012-b305-81c47b741017
\.


--
-- Data for Name: EmployeeLeaveBalance; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmployeeLeaveBalance" (id, "employeeId", "leaveTypeId", year, allocated, "carriedOver", used, "createdAt", "updatedAt") FROM stdin;
efbc39e8-d608-43b2-ab71-360203722785	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	c01b69ee-83c0-482d-af93-ad1690bc371d	2026	4	0	0	2026-01-26 12:40:38.756	2026-01-26 12:40:38.756
a9cfe78b-2b4e-4fd9-b49f-ace56fff7074	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	6e2652ac-a743-42eb-a56f-561af5f05646	2026	4	0	0	2026-01-26 12:40:38.756	2026-01-26 12:40:38.756
a1180278-906e-4eb6-b146-181cdc516112	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	9d6bebad-72ef-43c9-96e1-afa64c1616ef	2026	0	0	0	2026-01-26 12:40:38.756	2026-01-26 12:40:38.756
56edd8f3-1823-4eef-b116-ef961f60bf36	92f82430-03a8-4ea2-bd52-76d52f439c8d	c01b69ee-83c0-482d-af93-ad1690bc371d	2026	4	0	0	2026-01-27 14:22:53.734	2026-01-27 14:22:53.734
a8ea37d6-24c2-4e9c-8e7d-4081c0259d3a	92f82430-03a8-4ea2-bd52-76d52f439c8d	6e2652ac-a743-42eb-a56f-561af5f05646	2026	4	0	0	2026-01-27 14:22:53.734	2026-01-27 14:22:53.734
6dfe755f-1762-4770-9216-4f4228e6e349	92f82430-03a8-4ea2-bd52-76d52f439c8d	9d6bebad-72ef-43c9-96e1-afa64c1616ef	2026	0	0	0	2026-01-27 14:22:53.734	2026-01-27 14:22:53.734
\.


--
-- Data for Name: EmployeeSalaryComponent; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmployeeSalaryComponent" (id, "structureId", "componentId", "monthlyAmount") FROM stdin;
\.


--
-- Data for Name: EmployeeSalaryStructure; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmployeeSalaryStructure" (id, "employeeId", "netSalary", ctc, "effectiveDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Estimate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Estimate" (id, "companyId", "leadId", title, description, "estimatedValue", timeframe, status, "convertedToQuotationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Holiday; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Holiday" (id, name, date, type, "isActive", "createdAt", "updatedAt") FROM stdin;
b9e8fec1-195b-400d-81bf-bda54c902614	Republic Day	2026-01-26	national	t	2026-01-26 12:44:12.724	2026-01-26 12:44:12.724
\.


--
-- Data for Name: Interview; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Interview" (id, "candidateId", round, type, "scheduledAt", interviewer, feedback, rating, status, "createdAt", "updatedAt", "meetingLink") FROM stdin;
3b0ce297-e3ee-4485-b182-f0ef6c3e4762	3b85cac7-1dea-4012-b305-81c47b741017	1	Video Call	2026-02-06 10:20:00	arun kumar, director	\N	1	completed	2026-02-05 15:51:25.306	2026-02-05 16:25:20.729	\N
\.


--
-- Data for Name: InterviewScorecard; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."InterviewScorecard" (id, "interviewId", technical, communication, "problemSolving", "cultureFit", comments, "submittedBy", "createdAt", recommendation) FROM stdin;
21f114ed-d2bc-4fb8-9e34-17ff33f1f470	3b0ce297-e3ee-4485-b182-f0ef6c3e4762	1	1	1	1	no	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-02-05 16:25:20.733	reject
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Invoice" (id, "companyId", "clientId", "invoiceNumber", "invoiceDate", "dueDate", status, type, currency, terms, subtotal, tax, discount, total, "paidAmount", "isRecurring", "recurringId", notes, "pdfPath", "createdAt", "updatedAt", "nextOccurrence", "projectId", "recurringInterval", "recurringEndDate", "recurringNextRun", "recurringStartDate", "recurringStatus", "emailOpens", "isPublicEnabled", "lastEmailOpenedAt", "lastViewedAt", "publicExpiresAt", "publicToken", "viewCount") FROM stdin;
ad576d71-f1ed-4b05-9997-3aca3dfadf4e	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	bc6720f1-e405-42b8-8a2e-72976f715cd4	INV-2026-00002	2026-02-09	2026-02-15	sent	invoice	INR	Payment received in Partner’s Personal Savings Account (Temporary)\nOn behalf of Applizor Softech LLP, due to company bank account activation in process.	75000.00	13500.00	0.00	88500.00	0.00	t	\N	Thank you for your business.	\N	2026-02-09 11:48:41.71	2026-02-10 09:29:28.689	\N	36f02d11-e355-4e4d-817a-79cd71dc2674	monthly	\N	2026-02-01	2026-02-01	active	0	t	\N	\N	2026-03-12 09:29:28.688	0dc4d301-bea8-47b9-8537-cef5e281656b	0
ff885d2e-fa37-4287-9080-a74dfe14f63d	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	b1967151-5e54-4081-93f3-6ce5791cb641	INV-2026-00004	2026-02-10	2026-02-12	sent	invoice	INR	Payment received in Partner’s Personal Savings Account (Temporary)\nOn behalf of Applizor Softech LLP, due to company bank account activation in process.	9000.00	1620.00	0.00	10620.00	0.00	f	\N	Place of Supply: Telangana (36)	\N	2026-02-10 06:07:44.906	2026-02-10 09:32:55.565	\N	4f71f0db-5e72-4174-9db3-b10b5df1c66a	monthly	\N	\N	\N	active	0	t	\N	\N	2026-03-12 09:32:55.564	5346fccf-7731-4256-9c6f-30f189b3d126	0
\.


--
-- Data for Name: InvoiceActivity; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."InvoiceActivity" (id, "invoiceId", type, "ipAddress", "userAgent", location, "deviceType", browser, os, metadata, "createdAt") FROM stdin;
7f1581cf-40ef-4fee-9b02-3ea59b8509f7	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "CREATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9", "userName": "Admin User", "new_status": "draft"}	2026-02-09 11:48:41.736
eb6cf4e2-1b16-48b5-83d5-f5faf072f537	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 11:49:11.684
844aad26-cc1b-4170-b229-612960bbaf9a	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "UPDATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 11:55:39.104
dae61780-be63-4cf4-97c2-9e5beb09884d	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 11:55:51.336
5ccc9886-7989-4e5c-ade4-ccba861483b1	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 11:56:31.66
280cc039-008a-4824-bc03-f4c58b11e74b	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 11:56:44.162
49d1031a-7cd5-4e11-95e7-d7d890a183b9	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "UPDATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 11:58:07.476
b6132e3f-6e34-48a0-9338-da87e9a82316	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 11:58:11.297
f490e264-b08d-48eb-935c-b42e9cb8249e	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 13:34:13.332
f599bcbe-6f89-4c16-a83e-c7c715654263	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "UPDATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 13:35:44.949
521c4a2f-5712-447f-9685-a2615a4e6275	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "UPDATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 13:37:10.474
24888031-6caf-4d6b-a893-42e4ebfcc988	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 13:37:15.669
a5dedf4f-e68d-4e01-a971-0f1800813ebd	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 13:37:31.754
849fca4e-0873-484e-a8a6-31e4a0df9dc2	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 13:38:59.014
ad528ddb-0bc3-4bf1-883e-d408b79ec999	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 13:41:45.41
abd4edb7-6c18-45ac-a887-4818fc402fd3	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 13:57:53.674
c3589bdb-6cfe-497a-a20b-b695991a071f	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-09 14:00:01.06
43667e38-2c4d-4613-a0d6-8a1034bff129	ff885d2e-fa37-4287-9080-a74dfe14f63d	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "CREATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9", "userName": "Admin User", "new_status": "draft"}	2026-02-10 06:07:44.938
b902ec2b-5054-4311-948a-58545a0c0dc8	ff885d2e-fa37-4287-9080-a74dfe14f63d	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 06:07:49.836
3b8e7614-3ac2-44ba-a703-d15ee598a4cc	ff885d2e-fa37-4287-9080-a74dfe14f63d	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 06:09:15.012
825670c7-a05b-4566-86f6-603274aa500d	ff885d2e-fa37-4287-9080-a74dfe14f63d	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "UPDATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 06:19:48.063
029440ab-2362-4973-969f-831e9be172eb	ff885d2e-fa37-4287-9080-a74dfe14f63d	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "UPDATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 06:19:48.364
982dbc3b-eb51-43ba-b45f-7a7dc9fa0f06	ff885d2e-fa37-4287-9080-a74dfe14f63d	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 06:20:04.661
75d001f1-aaf0-44ed-9833-16fccb3cf336	ff885d2e-fa37-4287-9080-a74dfe14f63d	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "UPDATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 06:21:44.085
74a2a842-e0e7-42e5-af5c-463dac4f0804	ff885d2e-fa37-4287-9080-a74dfe14f63d	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 06:21:47.978
b2260ffe-e24b-46e8-94f1-dd09fa7e0672	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "UPDATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 06:43:19.927
a3df725c-48b9-46b5-88fe-8cbbba02965a	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 06:43:25.53
b9d3d61f-e7a0-4a76-92bc-6af28ecc95c3	ff885d2e-fa37-4287-9080-a74dfe14f63d	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "UPDATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 09:23:08.887
9b2b3e7c-1891-4f6b-8187-cdb6f92c2388	ff885d2e-fa37-4287-9080-a74dfe14f63d	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 09:23:36.482
37032b26-0d94-4c40-b344-4fa0aa64ffed	ff885d2e-fa37-4287-9080-a74dfe14f63d	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 09:25:41.187
8b6a29b6-6206-4cef-bd76-ed16aeb84a28	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 09:26:38.344
15eb651b-3f15-436a-9a1e-3782d7a56a62	ff885d2e-fa37-4287-9080-a74dfe14f63d	DOWNLOADED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "DOWNLOAD_PDF", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9"}	2026-02-10 09:26:40.317
a8d415aa-542d-4f8a-ad02-370a3a7562cb	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "PUBLIC_LINK_GENERATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9", "expiresAt": "2026-03-12T09:29:28.688Z", "publicToken": "0dc4d301-bea8-47b9-8537-cef5e281656b"}	2026-02-10 09:29:28.697
71c831cf-d437-49e3-b956-149d42468d59	ff885d2e-fa37-4287-9080-a74dfe14f63d	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	Admin	\N	{"action": "PUBLIC_LINK_GENERATED", "userId": "b4c0ba54-4a92-48fc-8a99-b27dd9de46f9", "expiresAt": "2026-03-12T09:32:55.564Z", "publicToken": "5346fccf-7731-4256-9c6f-30f189b3d126"}	2026-02-10 09:32:55.57
\.


--
-- Data for Name: InvoiceItem; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."InvoiceItem" (id, "invoiceId", description, quantity, rate, "taxRate", amount, "createdAt", "taxRateId", unit, discount, "hsnSacCode") FROM stdin;
5fb64f03-9f82-48da-8e46-f64837a69ac3	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	Angular Developer Resource (Monthly)	1.00	20000.00	0.00	20000.00	2026-02-10 06:43:19.901	\N	mo	0.00	998314
98cadef8-7877-46b5-8fac-48a26e9d3913	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	Back-end Developer Service (Monthly)	1.00	28000.00	0.00	28000.00	2026-02-10 06:43:19.901	\N	mo	0.00	998314
37b874ea-3b0b-456c-b3fe-e41ad8177b5e	ad576d71-f1ed-4b05-9997-3aca3dfadf4e	Full Stack Developer Service (Monthly)	1.00	27000.00	0.00	27000.00	2026-02-10 06:43:19.901	\N	mo	0.00	998314
1e57a2ec-23e5-4ea7-9a99-ff8a322a8840	ff885d2e-fa37-4287-9080-a74dfe14f63d	USM Systems Website Malware Removal & Security Cleanup	1.00	9000.00	0.00	9000.00	2026-02-10 09:23:08.843	\N	srv	0.00	998314
\.


--
-- Data for Name: InvoiceItemTax; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."InvoiceItemTax" (id, "invoiceItemId", "taxRateId", name, percentage, amount) FROM stdin;
35be05db-2e6d-4985-b371-d7445d27f42d	5fb64f03-9f82-48da-8e46-f64837a69ac3	fd15d625-acd8-4fde-984d-960eb4055b24	IGST	18.00	3600.00
c93ad0c5-5f8e-49fc-8d28-c6c2cf9bda8b	98cadef8-7877-46b5-8fac-48a26e9d3913	fd15d625-acd8-4fde-984d-960eb4055b24	IGST	18.00	5040.00
fa774a40-117c-45d8-a4ec-7615f946bbbc	37b874ea-3b0b-456c-b3fe-e41ad8177b5e	fd15d625-acd8-4fde-984d-960eb4055b24	IGST	18.00	4860.00
cc2a8ba7-9ad3-4d72-956b-c8c555abf853	1e57a2ec-23e5-4ea7-9a99-ff8a322a8840	fd15d625-acd8-4fde-984d-960eb4055b24	IGST	18.00	1620.00
\.


--
-- Data for Name: JobOpening; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."JobOpening" (id, "companyId", title, department, "position", description, requirements, status, "createdAt", "updatedAt") FROM stdin;
5194737d-671f-4a76-91af-88f6e254fea5	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	ASSISTANT SOFTWARE ENGINEER	Engineering	ASSISTANT SOFTWARE ENGINEER	test	est	open	2026-02-05 15:05:11.063	2026-02-05 15:05:11.063
\.


--
-- Data for Name: JournalEntry; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."JournalEntry" (id, "companyId", date, reference, description, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: JournalEntryLine; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."JournalEntryLine" (id, "journalEntryId", "accountId", debit, credit, description) FROM stdin;
\.


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Lead" (id, "companyId", name, email, phone, company, source, status, stage, value, notes, "assignedTo", "createdAt", "updatedAt", "assignedAt", "convertedAt", "convertedToClientId", "createdBy", industry, "jobTitle", "lastContactedAt", "nextFollowUpAt", priority, probability, "sourceDetails", tags, website, currency) FROM stdin;
1057847e-2fde-4372-baa2-7a96b374d995	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Arun Kumar Vishwakarma	arun1601for@gmail.com	+919226889662	dr upchar	website	won	closed	5000.00		b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-23 04:35:38.882	2026-01-23 04:35:58.824	\N	2026-01-23 04:35:58.822	b5fbcbfd-deb9-421b-9932-fb1420d0562a	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9			\N	\N	medium	0		{}	drupchar.com	INR
7c32e0a4-3e66-4a3d-b3e9-7b507b3aa8e8	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	prachi	arunrwds@gmail.com		wellness for you	website	won	closed	\N		b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-27 19:01:59.782	2026-01-27 19:03:48.305	\N	2026-01-27 19:03:48.301	2107cb32-f387-4409-8404-56407832b1b5	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9			2026-01-27 19:02:51.916	\N	medium	0		{}		INR
c6bbed9a-7056-4772-87ce-8d64d1fe41db	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Lakhan	arunsvishwakarma99999@gmail.com	+91 6206418710	DR UPCHAR	referral	won	closed	100000.00		b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-30 14:44:23.821	2026-02-01 08:49:53.907	\N	2026-02-01 08:49:53.905	ba44724c-4300-4993-bd22-c151c1e8527a	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9			2026-02-01 08:25:43.003	\N	medium	0		{}		INR
\.


--
-- Data for Name: LeadActivity; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LeadActivity" (id, "leadId", type, title, description, outcome, "scheduledAt", "completedAt", "dueDate", "reminderSent", "reminderTime", "assignedTo", "createdBy", status, "createdAt", "updatedAt") FROM stdin;
7af03916-e318-4660-8962-d6146747313a	1057847e-2fde-4372-baa2-7a96b374d995	conversion	Lead converted to client	Client ID: b5fbcbfd-deb9-421b-9932-fb1420d0562a	\N	\N	\N	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	pending	2026-01-23 04:35:58.833	2026-01-23 04:35:58.833
dd9f79fc-08bf-40cc-b523-6a3ae7abd45d	7c32e0a4-3e66-4a3d-b3e9-7b507b3aa8e8	call	tt cl			\N	2026-01-27 19:02:51.841	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	completed	2026-01-27 19:02:51.843	2026-01-27 19:02:51.843
36a55f09-cf0f-43d6-9b67-cfbcad169bc9	7c32e0a4-3e66-4a3d-b3e9-7b507b3aa8e8	conversion	Lead converted to client	Client ID: 2107cb32-f387-4409-8404-56407832b1b5	\N	\N	\N	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	pending	2026-01-27 19:03:48.336	2026-01-27 19:03:48.336
28fbb721-e4b7-496c-bd3a-2872f13355c6	7c32e0a4-3e66-4a3d-b3e9-7b507b3aa8e8	note	mona call			\N	2026-01-27 19:04:26.035	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	completed	2026-01-27 19:03:28.484	2026-01-27 19:04:26.049
2107243c-f45c-4f21-a23b-8a1dc5edd86e	c6bbed9a-7056-4772-87ce-8d64d1fe41db	note	Quotation generated please send to the client			\N	2026-02-01 08:25:42.997	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	completed	2026-02-01 08:25:42.998	2026-02-01 08:25:42.998
93af591d-4105-41a7-b2b0-149c5ee8474b	c6bbed9a-7056-4772-87ce-8d64d1fe41db	status_change	Stage changed to qualified	\N	\N	\N	\N	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	pending	2026-02-01 08:26:07.792	2026-02-01 08:26:07.792
d900bbb1-2d99-4df4-a0bf-4713af3c07c4	c6bbed9a-7056-4772-87ce-8d64d1fe41db	status_change	Stage changed to proposal	\N	\N	\N	\N	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	pending	2026-02-01 08:26:16.461	2026-02-01 08:26:16.461
7479daa1-3ccd-460e-b770-b2ae0b5977bb	c6bbed9a-7056-4772-87ce-8d64d1fe41db	conversion	Lead converted to client	Client ID: 1227fda5-a730-47dc-9974-927ba2a278b7	\N	\N	\N	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	pending	2026-02-01 08:41:35.361	2026-02-01 08:41:35.361
fde85b34-1d9d-49a4-8e55-6bebcef1b5c8	c6bbed9a-7056-4772-87ce-8d64d1fe41db	conversion	Lead converted to client	Client ID: ba44724c-4300-4993-bd22-c151c1e8527a	\N	\N	\N	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	pending	2026-02-01 08:49:53.924	2026-02-01 08:49:53.924
\.


--
-- Data for Name: LeaveAccrual; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LeaveAccrual" (id, "employeeId", "leaveTypeId", year, month, "accruedDays", "totalAccrued", "createdAt") FROM stdin;
\.


--
-- Data for Name: LeaveRequest; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LeaveRequest" (id, "employeeId", "leaveTypeId", "startDate", "endDate", days, reason, status, "approvedBy", "approvedAt", "createdAt", "updatedAt", "assignedBy", "attachmentPath", "durationType", category, "lopDays") FROM stdin;
\.


--
-- Data for Name: LeaveType; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LeaveType" (id, name, days, "isPaid", description, "createdAt", "updatedAt", frequency, "carryForward", "maxCarryForward", "monthlyLimit", "accrualRate", "accrualStartMonth", "accrualType", color, "departmentIds", "employmentStatus", encashable, "maxAccrual", "maxConsecutiveDays", "minServiceDays", "positionIds", "proofRequired", "sandwichRule", "policySettings", "confirmationBonus", "probationQuota", "quarterlyLimit") FROM stdin;
c01b69ee-83c0-482d-af93-ad1690bc371d	Sick Leave	4	t	\N	2026-01-23 04:26:48.834	2026-01-23 04:26:48.834	yearly	t	5	2	0	1	yearly	#3B82F6	{}	{}	f	0	10	0	{}	f	f	{"noticePeriod": 14, "minDaysForProof": 2, "minDaysForNotice": 4, "includeNonWorkingDays": false}	0	1	1
6e2652ac-a743-42eb-a56f-561af5f05646	Casual Leave	4	t	\N	2026-01-23 04:26:48.84	2026-01-23 04:26:48.84	yearly	t	5	2	0	1	yearly	#3B82F6	{}	{}	f	0	10	0	{}	f	f	{"noticePeriod": 14, "minDaysForProof": 2, "minDaysForNotice": 4, "includeNonWorkingDays": false}	0	1	1
9d6bebad-72ef-43c9-96e1-afa64c1616ef	Earned Leaves	18	t	\N	2026-01-23 04:26:48.845	2026-01-23 04:26:48.845	yearly	t	5	2	1.5	1	monthly	#3B82F6	{}	{}	f	0	10	0	{}	f	f	{"noticePeriod": 14, "minDaysForProof": 2, "minDaysForNotice": 4, "includeNonWorkingDays": false}	1.5	1	2
\.


--
-- Data for Name: LedgerAccount; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LedgerAccount" (id, "companyId", code, name, type, balance, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Milestone; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Milestone" (id, "projectId", title, description, "dueDate", amount, status, "order", "createdAt", "updatedAt", currency, "reviewStatus") FROM stdin;
89dafd0a-c2d6-4e53-a342-618ffd8df8e3	9aa9231b-55ed-4db9-91f8-f64014040d50	Logo designgin	\N	\N	2000.00	pending	0	2026-01-27 14:19:50.15	2026-01-27 14:19:50.15	INR	none
bb5d0af1-9544-4570-a5db-4966b214c37a	9aa9231b-55ed-4db9-91f8-f64014040d50	Logo desiing	\N	\N	500.00	pending	0	2026-01-27 14:55:05.077	2026-01-27 14:55:05.077	INR	none
\.


--
-- Data for Name: OfferLetter; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."OfferLetter" (id, "candidateId", "position", department, salary, "startDate", status, "documentPath", "createdAt", "updatedAt", "templateId") FROM stdin;
8c56bc7d-77cb-4c7a-b83c-0b57317c80b8	3b85cac7-1dea-4012-b305-81c47b741017	ASSISTANT SOFTWARE ENGINEER	Engineering	168000.00	2026-02-09	pending	\N	2026-02-05 16:26:44.698	2026-02-05 16:26:44.698	\N
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Payment" (id, "invoiceId", amount, "paymentDate", "paymentMethod", gateway, "transactionId", "gatewayOrderId", status, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payroll; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Payroll" (id, "employeeId", month, year, "basicSalary", allowances, deductions, "earningsBreakdown", "deductionsBreakdown", "grossSalary", "netSalary", status, "processedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Policy; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Policy" (id, "companyId", title, description, category, "fileUrl", "effectiveDate", "isActive", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Position; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Position" (id, "departmentId", title, description, "isActive", "createdAt", "updatedAt") FROM stdin;
020858a5-3766-4388-99cb-39f9af2c2879	a9e50298-d5db-4b87-8ab6-a8e12194321d	Senior Software Engineer	\N	t	2026-01-23 04:26:48.816	2026-01-23 04:26:48.816
72eac940-3040-462e-8736-cf9f43547af2	80f8b173-8253-4dff-be66-3b8229770117	HR Manager	\N	t	2026-01-23 04:26:48.829	2026-01-23 04:26:48.829
a72f4ce6-57e9-4128-900a-cf04e5d0d299	a9e50298-d5db-4b87-8ab6-a8e12194321d	ASSISTANT SOFTWARE ENGINEER		t	2026-02-04 19:09:06.497	2026-02-04 19:09:06.497
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Project" (id, "companyId", "clientId", name, description, status, "startDate", "endDate", budget, "isBillable", "createdAt", "updatedAt", "actualExpenses", "actualRevenue", priority, tags, settings, currency) FROM stdin;
9aa9231b-55ed-4db9-91f8-f64014040d50	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	b5fbcbfd-deb9-421b-9932-fb1420d0562a	safalcode		active	2026-01-27 00:00:00	\N	\N	t	2026-01-27 05:50:34.813	2026-01-27 15:43:48.436	\N	\N	medium	{}	{"permissions": {"member": {"tasks": {"edit": true, "view": true, "create": true, "delete": false}, "settings": {"edit": false, "view": false}, "financials": {"edit": false, "view": false, "create": false, "delete": false}, "milestones": {"edit": false, "view": true, "create": false, "delete": false}}, "viewer": {"tasks": {"edit": false, "view": true, "create": false, "delete": false}, "settings": {"edit": false, "view": false}, "financials": {"edit": false, "view": false, "create": false, "delete": false}, "milestones": {"edit": false, "view": true, "create": false, "delete": false}}}, "notificationEmail": "info@applizor.com"}	INR
d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	ba44724c-4300-4993-bd22-c151c1e8527a	dr upchar	health care project	active	2026-02-03 00:00:00	\N	\N	t	2026-02-03 13:24:59.255	2026-02-03 13:24:59.255	\N	\N	medium	{}	\N	INR
36f02d11-e355-4e4d-817a-79cd71dc2674	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	bc6720f1-e405-42b8-8a2e-72976f715cd4	IT LAB SPEED		active	2024-04-01 00:00:00	\N	\N	t	2026-02-09 11:44:56.185	2026-02-09 11:44:56.185	\N	\N	medium	{}	\N	INR
4f71f0db-5e72-4174-9db3-b10b5df1c66a	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	b1967151-5e54-4081-93f3-6ce5791cb641	USM SYSTEMS		active	2026-02-05 00:00:00	\N	\N	t	2026-02-10 09:22:35.559	2026-02-10 09:22:35.559	\N	\N	medium	{}	\N	INR
\.


--
-- Data for Name: ProjectMember; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ProjectMember" (id, "projectId", "employeeId", role, "joinedAt", "canManageTasks", "canManageTeam", "canViewBudget") FROM stdin;
548fff97-376f-4d1c-a183-be532dcb3f60	9aa9231b-55ed-4db9-91f8-f64014040d50	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	member	2026-01-27 06:25:37.336	t	f	f
e4833b0b-4479-4ef9-9ca0-e227559196a8	9aa9231b-55ed-4db9-91f8-f64014040d50	92f82430-03a8-4ea2-bd52-76d52f439c8d	member	2026-01-27 18:37:05.32	t	f	f
2213afa4-ff50-4bc7-874d-797d5c1b9986	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	member	2026-02-03 13:30:03.474	t	f	f
1d8b3a03-5b82-49d9-8b08-35d759970717	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	92f82430-03a8-4ea2-bd52-76d52f439c8d	member	2026-02-03 13:30:06.342	t	f	f
\.


--
-- Data for Name: ProjectNote; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ProjectNote" (id, "projectId", title, content, "isPinned", "createdBy", "createdAt", "updatedAt") FROM stdin;
8d3641ba-ab6a-47fb-8f06-c922ce34ee9e	9aa9231b-55ed-4db9-91f8-f64014040d50	Page 1 checking database docs	Healthcare Appointment & Engagement Platform – Full SRS\n1. Introduction\nThis document defines the complete Software Requirement Specification (SRS) for a phase-wise healthcare platform including Patient-Doctor appointment booking in Phase-1 and MR/Brand Promotion in Phase-2. The goal is to build a scalable, revenue-ready system.\n2. Project Objectives\n- Launch a B2C patient-doctor appointment platform\n- Digitize doctor appointment management\n- Prepare foundation for MR & Pharma brand revenue engine\n- Enable scalable multi-city rollout\n3. User Roles\nPatient:\n- Search doctors\n- Book appointments\n- Make partial payments\n\nDoctor:\n- Manage availability\n- View appointments\n- Manage patient follow-ups\n\nAdmin:\n- Manage doctors, patients, payments\n- Monitor bookings & reports\n4. Phase 1 – Patient & Doctor Module (MVP)\n4.1 Patient Features:\n- Registration & login (OTP based)\n- Doctor search (location, specialty)\n- Appointment booking with time slots\n- Online partial payment\n- Appointment history & notifications\n\n4.2 Doctor Features:\n- Doctor onboarding & verification\n- Slot & availability management\n- Appointment dashboard\n- Patient notes & follow-ups\n\n4.3 Admin Features:\n- Doctor approval & management\n- Appointment lifecycle control\n- Commission & payment tracking\n- City/area-wise reports\n5. Advanced Features (Phase-1 Added)\n- Auto slot conflict resolution\n- Smart rescheduling\n- Follow-up reminder engine\n- Role-based access control (RBAC)\n- Audit logs\n- Soft delete & data recovery\n- Scalable notification system (SMS/WhatsApp)\n6. Phase 2 – MR / Brand Promotion Module\n6.1 Pharma Brand:\n- Brand onboarding\n- Campaign creation\n- Doctor targeting\n- Budget & duration control\n\n6.2 MR Features:\n- MR login\n- Doctor visit booking\n- Visit confirmation\n\n6.3 Doctor:\n- MR time slot management\n- Brand content display (tablet mode)\n7. Non-Functional Requirements\n- High availability & scalability\n- Secure payments & data encryption\n- Performance optimized APIs\n- Modular architecture\n- Cloud ready deployment\n8. Technology Stack (Suggested)\n- Frontend: React / Next.js\n- Backend: Java Spring Boot / Node.js\n- Database: PostgreSQL\n- Payments: Razorpay\n- Cloud: Azure / AWS\n9. Future Enhancements\n- AI-based doctor recommendation\n- Predictive analytics\n- Smart MR campaign optimization\n- Multi-language support\n10. Conclusion\nThis SRS serves as the baseline document for development, costing, and client discussions. Any changes will be handled through controlled change requests.\n	f	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	2026-01-27 18:05:48.505	2026-01-27 18:05:48.505
13f0f18e-7801-4f7e-81fc-ff845c503688	9aa9231b-55ed-4db9-91f8-f64014040d50	booking page task	1. need auto search feature.	f	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	2026-01-27 18:06:30.266	2026-01-27 18:06:30.266
\.


--
-- Data for Name: Quotation; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Quotation" (id, "companyId", "leadId", "clientId", "quotationNumber", title, description, "quotationDate", "validUntil", status, subtotal, tax, discount, total, currency, "paymentTerms", "deliveryTerms", notes, "pdfPath", "templateId", "publicToken", "publicExpiresAt", "isPublicEnabled", "clientViewedAt", "clientAcceptedAt", "clientRejectedAt", "clientSignature", "clientEmail", "clientName", "clientComments", "signedPdfPath", "convertedToInvoiceId", "convertedAt", "createdBy", "assignedTo", "createdAt", "updatedAt", "emailOpens", "lastEmailOpenedAt", "lastViewedAt", "viewCount", "maxReminders", "nextReminderAt", "reminderCount", "reminderFrequency") FROM stdin;
82ab06b1-53c4-4fd7-a988-d7337f744a1b	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	c6bbed9a-7056-4772-87ce-8d64d1fe41db	ba44724c-4300-4993-bd22-c151c1e8527a	QUO-2026-0001	Diagnostic Booking & Report Management System	<h4><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Admin Panel</strong></b></h4><ul class="list-disc ml-5 mb-4 space-y-1"><li value="1" class="pl-1"><span style="white-space: pre-wrap;">Add and manage diagnostic tests</span></li><li value="2" class="pl-1"><span style="white-space: pre-wrap;">Create and manage test profiles (packages)</span></li><li value="3" class="pl-1"><span style="white-space: pre-wrap;">Add and manage diagnostic centers</span></li><li value="4" class="pl-1"><span style="white-space: pre-wrap;">Set center location (city / area)</span></li><li value="5" class="pl-1"><span style="white-space: pre-wrap;">Configure payment gateway details for each center</span></li><li value="6" class="pl-1"><span style="white-space: pre-wrap;">View patients and all bookings</span></li><li value="7" class="pl-1"><span style="white-space: pre-wrap;">Upload test reports in PDF format against bookings</span></li></ul><h4><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Patient Portal</strong></b></h4><ul class="list-disc ml-5 mb-4 space-y-1"><li value="1" class="pl-1"><span style="white-space: pre-wrap;">Location selection (city / area)</span></li><li value="2" class="pl-1"><span style="white-space: pre-wrap;">View nearest available diagnostic centers</span></li><li value="3" class="pl-1"><span style="white-space: pre-wrap;">Option to select </span><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Home Collection</strong></b><span style="white-space: pre-wrap;"> if no nearby center is available</span></li><li value="4" class="pl-1"><span style="white-space: pre-wrap;">Select tests or test profiles</span></li><li value="5" class="pl-1"><span style="white-space: pre-wrap;">Online payment integration</span></li><li value="6" class="pl-1"><span style="white-space: pre-wrap;">Booking visibility in admin panel</span></li><li value="7" class="pl-1"><span style="white-space: pre-wrap;">Simple login using </span><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">email and mobile number only</strong></b></li><li value="8" class="pl-1"><span style="white-space: pre-wrap;">View and download uploaded test reports (PDF) after login</span></li></ul><h4><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Design &amp; User Experience</strong></b></h4><ul class="list-disc ml-5 mb-4 space-y-1"><li value="1" class="pl-1"><span style="white-space: pre-wrap;">Clean and functional UI</span></li><li value="2" class="pl-1"><span style="white-space: pre-wrap;">Primary focus on </span><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">seamless, fast, and reliable booking flow</strong></b></li></ul><h3 class="text-lg font-bold text-slate-800 mb-2 mt-4"><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Timeline</strong></b></h3><ul class="list-disc ml-5 mb-4 space-y-1"><li value="1" class="pl-1"><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">45 days</strong></b><span style="white-space: pre-wrap;"> from project start date</span></li></ul>	2026-02-01	2026-02-02	sent	100000.00	17100.00	5000.00	107100.00	INR	50% Advance to start work.	Delivery via Email/Cloud Link.	This quotation is valid for 1 days.	\N	\N	e0bf4788-b968-4e1e-ba4f-9b00a22710f0	2026-03-03 15:30:57.501	t	2026-02-01 15:31:03.763	2026-02-01 15:31:52.038	\N	data:image/png;base64,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S11P0rIk5YRRsObQQw91redVkJuba2+88YZddtllrtW2bt1qTz75pLN8ZdCgQa71KPCPgGY15eTkJNWhqlWrmpa7afZUUidSGQEEEEAAAQQQCIpASPpJQCYkN5JhIICA/wTGjBljOTk59vTTT7t2Th+ax44da3l5ea51kilQXhktiVK7bud98cUXzvVycnJMy5nc6nG8dAXmz59vV1xxRVKd2GuvvWzKlCmmAF1SJ1IZAQQQQAABBDwFKEQgEwIEZDKhSpsIIBBpAeX7aNu2rfXs2dPT4eKLL7Y5c+bYOeec41kvmUJ9EB8wYIApyFO3bt24p1511VXWrVs3YyemuFRZrfDuu+86s6oWL16c8HW1dE3BtiZNmiR8DhURQAABBHwrQMcQQCACAgRkInCTGSICCGRH4KeffrIRI0ZYq1at7LnnnnO96AknnODMTHnqqafssMMOc61XkgLNkNGylX79+sVtZtKkSda0aVMbPHiwLVu2zPivdAX03lG+n2+++Sbhjuh+K7nzQQcdlPA5VEQAAQT2FOAVAggggEC2BQjIZFuc6yGAQGgFNOOlf//+rol799tvP7vkkkuc2SjJLkVJBa1cuXI2fPhw55HI+XfccYc1bNjQyC+TiFbm6sh/x44dCV+gUqVKntufJ9wQFRHItgDXQwABBBBAIOICBGQi/gZg+AggUHKBu+66y8kVM3fuXM/Ghg4dalOnTrWKFSt61kt3oWbJrFmzxjSLIpG2lVemT58+9vnnnydSnTppFNAOWytXrkyqxS+//DKp+lGuzNgRQAABBBBAAAE/CRCQ8dPdoC8IIBAogeeff95uvPFGu/322z37nZubaz/++GPcnDKejZSwsGbNms4sikSSB3/11Vf28MMPOzlMlJi4hJeO8ulJjf3CCy+0t99+O+FzNDNm165dCdenIgIIIIAAAggggIC/BAjI+Ot+0BsEEAiIgAIb559/vt13332uPVZ+mL///e/OFsRlypRxrZe+gvgt3XnnnU5gRglg49XOz893gkjKL7N+/fp41SkvgYBmT82cOTPhFnT/mBmTMBcVEUAAAQQQQAABXwoQkPHlbaFTCAREIILdVJBCAQrl+XAb/r777mva6UizHVTXrV5pHdfSJSWAjbcLVEH/NObTTz/dSVhccIyf6RPYsGGD3XTTTQk3ePTRR5vuX8InUBEBBBBA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	arun1601for@gmail.com	lakhan	\N	\N	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	\N	2026-02-01 15:30:21.151	2026-02-09 11:46:24.686	0	\N	2026-02-03 11:44:35.062	9	3	\N	0	
\.


--
-- Data for Name: QuotationActivity; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."QuotationActivity" (id, "quotationId", type, "ipAddress", "userAgent", location, "deviceType", browser, os, metadata, "createdAt") FROM stdin;
a4bd4d75-fb93-4a26-a4d5-8b44560e326e	82ab06b1-53c4-4fd7-a988-d7337f744a1b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	Desktop	Portal	\N	\N	2026-02-01 15:30:38.402
fa091649-5f02-4aa2-814e-36d8cf6a44d0	82ab06b1-53c4-4fd7-a988-d7337f744a1b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	Desktop	Portal	\N	\N	2026-02-01 15:30:38.463
a9bfe588-6b43-4817-8d5c-97a9f037415b	82ab06b1-53c4-4fd7-a988-d7337f744a1b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	Desktop	Portal	\N	\N	2026-02-01 15:31:03.769
4f4bce8b-5616-49a9-a558-8e72bbeca44e	82ab06b1-53c4-4fd7-a988-d7337f744a1b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	Desktop	Portal	\N	\N	2026-02-01 15:31:03.802
7e5d5b48-9797-430a-8530-059cc533c15f	82ab06b1-53c4-4fd7-a988-d7337f744a1b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	Desktop	Portal	\N	\N	2026-02-01 15:31:40.012
40f177b4-3a6a-49e2-89a0-00c857f63c33	82ab06b1-53c4-4fd7-a988-d7337f744a1b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	Desktop	Portal	\N	\N	2026-02-01 15:31:40.068
0f1f338c-e788-4d05-972d-79afaa39818b	82ab06b1-53c4-4fd7-a988-d7337f744a1b	STATUS_CHANGE	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	Desktop	Portal	\N	{"new_status": "accepted", "portal_user": "Lakhan", "client_action": true}	2026-02-01 15:32:04.7
087b4972-0e25-45d7-ab11-fb4f65dcb226	82ab06b1-53c4-4fd7-a988-d7337f744a1b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	Desktop	Portal	\N	\N	2026-02-01 15:32:04.751
a3dce3b7-3109-4608-ab5b-cef1cf1ea0c9	82ab06b1-53c4-4fd7-a988-d7337f744a1b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	Desktop	Portal	\N	\N	2026-02-03 11:44:35.023
79a2c41d-b6e7-4107-9555-0fbf908be20b	82ab06b1-53c4-4fd7-a988-d7337f744a1b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	Desktop	Portal	\N	\N	2026-02-03 11:44:35.068
\.


--
-- Data for Name: QuotationItem; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."QuotationItem" (id, "quotationId", description, quantity, "unitPrice", tax, discount, total, "taxRateId", unit, "hsnSacCode") FROM stdin;
c9bc1ef4-00f9-4dda-b2bc-5e9878ce1367	82ab06b1-53c4-4fd7-a988-d7337f744a1b	Software Development Services	1.00	100000.00	0.00	5.00	112100.00	\N	srv	998314
\.


--
-- Data for Name: QuotationItemTax; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."QuotationItemTax" (id, "quotationItemId", "taxRateId", name, percentage, amount) FROM stdin;
ee2ab702-610c-474c-8ff0-54a453821c6d	c9bc1ef4-00f9-4dda-b2bc-5e9878ce1367	fd15d625-acd8-4fde-984d-960eb4055b24	IGST	18.00	17100.00
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Role" (id, name, description, "isSystem", "createdAt", "updatedAt") FROM stdin;
2efe4dac-9b40-4436-b299-badda6396405	HR	Human Resources Manager	f	2026-01-23 04:26:48.717	2026-01-23 04:26:48.717
2af33051-91e2-49b0-be8e-e879b80dc41c	Employee	Regular Employee	f	2026-01-23 04:26:48.771	2026-02-03 13:59:53.053
fbd2165d-3336-49b8-9b1f-188fbcd27b25	Admin	Full system access	t	2026-01-23 04:26:48.646	2026-02-03 18:38:34.797
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."RolePermission" (id, "roleId", "createdAt", "createLevel", "deleteLevel", module, "readLevel", "updateLevel") FROM stdin;
796ca864-0dde-4571-b637-1879be2b41a2	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.719	all	all	Employee	all	all
66b417f1-79e1-4bd0-ba2b-59ab65d50eb1	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.722	all	all	Department	all	all
7384860d-05b4-4ba2-af01-27cb97fcdb1e	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.736	all	all	Position	all	all
1a9d54e2-28dc-4f79-84c0-c23d2ed12e2a	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.739	all	all	Attendance	all	all
97aa0c19-acdc-4842-b1a4-7569f8cf7c90	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.742	all	all	Leave	all	all
cf32c295-9c62-4659-b23b-a7d8b66369c5	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.745	all	all	LeaveType	all	all
d8e07970-913a-4d40-a208-1637507d4075	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.749	all	all	LeaveBalance	all	all
c3b46e9a-179d-4ff7-92e3-137efd3b7a39	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.757	all	all	Shift	all	all
869a17cd-57cf-40f6-822f-aac702aeb010	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.76	all	all	Recruitment	all	all
a017787d-fdf1-47bd-9e14-b2db36ea83b4	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.763	all	all	Payroll	all	all
01dbdd16-894f-46a1-9fa3-b8d53a2511ce	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.766	all	all	Asset	all	all
bf77b886-e049-40a1-a1b7-8521d31fc597	2efe4dac-9b40-4436-b299-badda6396405	2026-01-23 04:26:48.768	all	all	Document	all	all
446bcf24-f151-476f-98bb-021892c2d8da	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.517	none	none	Company	none	none
67789627-57d5-4c0b-808b-435d53cdcbf9	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.523	none	none	User	none	none
9e581516-1c88-4761-9231-54b201ed7523	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.526	none	none	Role	none	none
c029aef5-8e81-4b5a-aa0f-a0028cf58bc6	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.528	none	none	Client	none	none
efb8c468-8414-49a6-9f91-74e05da5176a	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.531	none	none	Lead	none	none
44e8982b-fe9b-4545-855a-3ff2db50c87d	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.804	none	none	Department	all	none
7bbaa061-e58e-49b6-9917-f20e53abe9e6	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.806	none	none	Position	all	none
56548429-b207-434e-a8db-72a27dea3321	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.784	none	none	Employee	owned	none
8fbfb740-4744-4b40-b456-3a3965854bb0	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.786	all	owned	Attendance	owned	owned
57d2a774-3b0f-4b76-9840-e3dbda564181	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.777	all	owned	Leave	owned	owned
79533593-9bcc-45d0-b57b-49be973785c4	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.789	none	none	LeaveType	all	none
152523eb-986b-45fc-bb9c-43996f752a24	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.791	none	none	LeaveBalance	owned	owned
d403fd9c-3222-4328-bcb9-f58f1bd1d680	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.795	none	none	Shift	all	none
5f73c571-b970-40f4-8eed-d695add9b974	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.799	none	none	ShiftRoster	owned	none
bcef6c21-f6f2-4dce-916f-2812af9e0ac4	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.781	owned	none	Document	owned	owned
07360b8b-c175-4a6f-ae66-a985b4b31b0d	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.801	none	none	Holiday	all	none
b0f125e1-ccf7-4665-bbd0-2406045ae396	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.651	all	all	Dashboard	all	all
65fd3096-864c-42ba-af72-b3c23216db5f	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.656	all	all	Company	all	all
a06e9ec1-2291-499c-89a5-6e21471d8f9b	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.659	all	all	User	all	all
a92c48b7-8b71-4f25-90b1-abf86db85a1c	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.661	all	all	Role	all	all
df8bdaf2-0a9f-417b-871f-83a5cd788a2f	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.664	all	all	Client	all	all
1ec61b09-0e88-47ce-a0b1-d3c4da29a0e0	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.666	all	all	Lead	all	all
0e8111af-7eb2-4a39-afcc-741381ebed33	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.671	all	all	Quotation	all	all
5c859a0a-0b04-4d30-9540-0ad8577ceb2e	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.713	all	all	QuotationTemplate	all	all
59fa7fdc-278c-4089-830f-081ccc3f7336	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.673	all	all	Invoice	all	all
caa9a9f4-2c7c-4b13-a303-fc6d133c9b94	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.675	all	all	Payment	all	all
ccece0e9-badf-4f0d-a8dc-58a73483b6c2	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.677	all	all	Subscription	all	all
82fab1ca-6bf2-4ef7-a725-e1ea985265ef	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.679	all	all	Department	all	all
10026a11-0bae-42cd-b025-529bf1b1c469	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.681	all	all	Position	all	all
c9e409d9-4c98-4d25-a405-cf01f91bd639	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.683	all	all	Employee	all	all
2926bbc0-828f-42a4-a264-09ff1c456f6b	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.685	all	all	Attendance	all	all
85db0d96-819b-468e-9841-a6f1fe688f83	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.687	all	all	Leave	all	all
879fd206-b861-45e1-b8c5-0d16329d3e27	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.691	all	all	LeaveBalance	all	all
83e00d2f-9fd3-4e45-9b8c-b2f8eb505c84	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.694	all	all	Shift	all	all
7c6b5381-3a36-4cb6-88e2-2e9700b39ce3	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.696	all	all	ShiftRoster	all	all
73e0553b-dbbe-4131-a613-711de05875b5	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.698	all	all	Payroll	all	all
f8ad2102-5b14-46b7-b993-6d31f1096761	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.7	all	all	Asset	all	all
df07b86e-36c6-45dc-b5ab-b077d3e2551a	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.703	all	all	Recruitment	all	all
c0aed786-2a77-4906-8216-cc4a111d02b3	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.707	all	all	Document	all	all
c68bd51a-403f-4560-b0e9-e2956ec73b05	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.71	all	all	Holiday	all	all
48be23a6-0f9f-4019-995f-9436744873c1	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 10:19:25.477	all	all	Contract	all	all
112b1e35-5b2f-41a0-bb81-c0d58faab0e2	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.774	none	none	Dashboard	all	none
d27c2ec8-748c-4161-99f9-b307d931a6de	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.534	none	none	LeadActivity	none	none
f9443c34-f0f4-4220-a105-3b2bfe54fed7	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.537	none	none	Quotation	none	none
39c1c204-5c5c-44cd-9edb-37b4de0b46f6	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.54	none	none	QuotationTemplate	none	none
1a0a6efa-f661-4ba5-92bf-3957625c6991	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.543	none	none	Invoice	none	none
ffbb94d7-5ba8-4ce4-bf0f-97c65ba12f28	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.545	none	none	Payment	none	none
6af09ab2-5909-4664-a087-d4f349856a1c	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.548	none	none	Subscription	none	none
143d3140-e6a7-49a3-a38e-8a0013ad773b	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.572	none	none	Payroll	none	none
dde53bc4-0661-47f4-8ac1-daa78442db6d	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.575	none	none	Asset	none	none
64fd6ddb-3a9d-4d83-b3a2-84ce286fe08a	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.578	none	none	Recruitment	none	none
7760c8eb-d8a2-488c-8a62-773e44906f2d	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-27 06:27:56.175	none	none	Project	owned	added_owned
3d4bc11d-7411-425f-83e4-70b1c8cdf1e6	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-27 06:27:56.195	all	none	ProjectTask	added_owned	added_owned
08bb7368-d02b-4c14-b0c8-b9a3259c74ae	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-02-03 13:59:53.137	all	none	Timesheet	added_owned	added_owned
72a8d6f4-2a01-461e-afcc-eab8399c02c6	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.585	none	none	Contract	none	none
1bfc5900-d3a5-4f67-b332-7ac0553f0e68	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.668	all	all	LeadActivity	all	all
0210f98e-0101-4168-88fe-cd6a6968bded	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.689	all	all	LeaveType	all	all
245d4483-ad9a-469a-a6c7-c645034ff1bc	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-02-03 18:38:34.922	all	all	SalaryComponent	all	all
7b00eb10-00a0-4f8f-a87c-fd8b2ca7a276	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-02-03 18:38:34.938	all	all	SalaryStructure	all	all
dec8ca94-58ca-4a1e-b3cb-5db4d221ba8a	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-02-03 18:38:34.954	all	all	RecruitmentBoard	all	all
61565b46-784e-45c5-a9ac-85fbea87c491	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-26 13:27:00.911	all	all	Project	all	all
700445e6-3ca5-4257-b357-33f3c42c6f5f	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-26 13:27:00.913	all	all	ProjectTask	all	all
da4cd3f1-2f5a-43be-aec1-02cda6bd2061	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-30 14:32:04.039	all	all	Timesheet	all	all
7403dd87-1194-465b-91c6-f2ca9ec8ed51	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:34.986	none	none	Dashboard	none	none
ce07958e-243c-46e2-b335-394aa74af152	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:34.996	none	none	Company	none	none
ed312918-aba4-4895-8aa2-105a22476a06	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.001	none	none	User	none	none
8e534c00-8a50-4675-942b-d828bf339a76	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.005	none	none	Role	none	none
14d90bc7-6579-42ff-9f64-57267e9420ee	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.01	none	none	Client	none	none
2ea87aa6-241b-4d7e-9940-36f9a80e3b4a	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.015	none	none	Lead	none	none
9859ab1e-276f-47f4-86eb-633593836c77	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.02	none	none	LeadActivity	none	none
5ba6a5ab-66f6-4654-9a11-4e936b2624bb	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.024	none	none	Quotation	none	none
849ea66b-237e-4b3a-b295-fea3b5974e4c	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.03	none	none	QuotationTemplate	none	none
971222c1-da15-4847-9f63-e9d0c502976a	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.035	none	none	Invoice	none	none
1e5c61d3-78fe-4143-9d03-ee03de347bf7	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.039	none	none	Payment	none	none
e070332c-fc81-4f0a-8fed-7b48c3867398	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.044	none	none	Subscription	none	none
eefcedba-0152-4acd-b1e4-e6cc3a01c7e9	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.063	none	none	ShiftRoster	none	none
ab9145c0-be0d-4856-b843-62602001d428	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.071	none	none	SalaryComponent	none	none
b3f7a470-b1e7-4fa5-ad77-7a3c305b7796	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.074	none	none	SalaryStructure	none	none
a220b0bb-106c-4b2e-bd0c-f0b158856637	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.08	none	none	RecruitmentBoard	none	none
88a4e92c-1515-4dc0-9228-fbfe02c167a7	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.085	none	none	Project	none	none
5365d74f-86e1-4cfa-8c4e-1f15870de1ac	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.089	none	none	ProjectTask	none	none
7f22c327-15a7-4d3f-876e-b8861e970a5d	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.093	none	none	Timesheet	none	none
65be74c4-9c33-4154-a9c1-e48a4fddd515	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.097	none	none	Holiday	none	none
8558061b-2f90-4bd3-ad40-578d4802a3a3	2efe4dac-9b40-4436-b299-badda6396405	2026-02-05 15:03:35.1	none	none	Contract	none	none
e13830a7-c301-4d48-ba1f-d7ce9a6da943	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-02-05 15:03:35.138	none	none	SalaryComponent	none	none
26ece19b-8669-41fb-82fa-bd84e9ff27d4	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-02-05 15:03:35.143	none	none	SalaryStructure	none	none
d010e415-e677-4238-9b6b-75787add802a	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-02-05 15:03:35.15	none	none	RecruitmentBoard	none	none
\.


--
-- Data for Name: SalaryComponent; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."SalaryComponent" (id, "companyId", name, type, "calculationType", "defaultValue", "isActive", "createdAt", "updatedAt", "isTaxable") FROM stdin;
\.


--
-- Data for Name: SalesTarget; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."SalesTarget" (id, "companyId", "employeeId", period, "startDate", "endDate", "targetAmount", "achievedAmount", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Shift; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Shift" (id, "companyId", name, "startTime", "endTime", "breakDuration", "isActive", "createdAt", "updatedAt", "workDays") FROM stdin;
e878e7f8-b9f4-4353-9cf9-72e0a39afc64	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	General Shift	10:00	19:00	60	t	2026-01-26 12:43:19.494	2026-01-26 12:43:19.494	["monday", "tuesday", "wednesday", "thursday", "friday"]
\.


--
-- Data for Name: ShiftRoster; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ShiftRoster" (id, "employeeId", "shiftId", date, "createdAt", "updatedAt") FROM stdin;
3c12aaf5-d0cb-4635-be47-07543e3a167d	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-27	2026-01-26 12:44:32.149	2026-01-27 14:23:16.092
d577275f-7af8-4550-b519-02e8903a43c4	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-28	2026-01-26 12:44:32.149	2026-01-27 14:23:16.092
e999859c-b75e-4810-b2cc-111788d87e3d	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-29	2026-01-26 12:44:32.149	2026-01-27 14:23:16.092
20daf404-ac5a-437e-bae0-64d36c841846	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-30	2026-01-26 12:44:32.149	2026-01-27 14:23:16.092
61fed486-3e70-4e60-bbf2-e5d1484f25c9	92f82430-03a8-4ea2-bd52-76d52f439c8d	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-27	2026-01-27 14:23:16.092	2026-01-27 14:23:16.092
b53b76f6-d54a-4f5e-b156-562a797f388f	92f82430-03a8-4ea2-bd52-76d52f439c8d	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-28	2026-01-27 14:23:16.092	2026-01-27 14:23:16.092
85ffce31-fcb1-484d-979a-62a97cf0b8f7	92f82430-03a8-4ea2-bd52-76d52f439c8d	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-29	2026-01-27 14:23:16.092	2026-01-27 14:23:16.092
a28b262a-0ce3-433a-be43-72be578d024d	92f82430-03a8-4ea2-bd52-76d52f439c8d	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-30	2026-01-27 14:23:16.092	2026-01-27 14:23:16.092
b0cf204a-6cbf-4fea-b84e-90fed7022edc	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-02	2026-01-26 12:45:51.049	2026-01-27 14:23:28.575
b6f8e77c-18e6-48bf-b089-229b7fd44ec6	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-03	2026-01-26 12:45:51.049	2026-01-27 14:23:28.575
5b011de6-a531-4501-9081-5cf0f1b73aed	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-04	2026-01-26 12:45:51.049	2026-01-27 14:23:28.575
a3f95d4b-7c39-4964-b9c8-186f145cf7f7	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-05	2026-01-26 12:45:51.049	2026-01-27 14:23:28.575
c4266a86-8b12-42df-ada6-f72c8f7bae05	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-06	2026-01-26 12:45:51.049	2026-01-27 14:23:28.575
72b14f1e-51a9-48d9-ae6f-ec86ae6bd772	92f82430-03a8-4ea2-bd52-76d52f439c8d	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-02	2026-01-27 14:23:28.575	2026-01-27 14:23:28.575
ea50fca8-24b5-4195-8608-a1edb0a45e4a	92f82430-03a8-4ea2-bd52-76d52f439c8d	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-03	2026-01-27 14:23:28.575	2026-01-27 14:23:28.575
682a28be-93ae-4d5f-83da-4aea38b29408	92f82430-03a8-4ea2-bd52-76d52f439c8d	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-04	2026-01-27 14:23:28.575	2026-01-27 14:23:28.575
53689a3c-d64e-42ab-8d97-083c4383f0d7	92f82430-03a8-4ea2-bd52-76d52f439c8d	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-05	2026-01-27 14:23:28.575	2026-01-27 14:23:28.575
9ec0072d-575d-4d47-a54f-dbfd1940c0fc	92f82430-03a8-4ea2-bd52-76d52f439c8d	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-06	2026-01-27 14:23:28.575	2026-01-27 14:23:28.575
\.


--
-- Data for Name: Sprint; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Sprint" (id, "projectId", name, goal, "startDate", "endDate", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: StatutoryConfig; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."StatutoryConfig" (id, "companyId", "pfEmployeeRate", "pfEmployerRate", "pfBasicLimit", "esiEmployeeRate", "esiEmployerRate", "esiGrossLimit", "professionalTaxEnabled", "tdsEnabled", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Subscription" (id, "companyId", "clientId", name, plan, amount, "billingCycle", "startDate", "endDate", status, "nextBillingDate", "createdAt", "updatedAt", currency) FROM stdin;
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Task" (id, "projectId", title, description, status, priority, "dueDate", "createdById", "assignedToId", "createdAt", "updatedAt", "milestoneId", tags, type, "createdClientId", "epicId", "parentId", "position", "sprintId", "startDate", "storyPoints") FROM stdin;
7993345e-0166-4a5b-949f-efba86bffee3	9aa9231b-55ed-4db9-91f8-f64014040d50	Create a new api for getting client notification whatsapp	<p>Create new api for getting client notification whatsapp</p><p><br></p><p><img src="data:image/png;base64,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OeKII2sZzuv25198JjNmzJCSRImsvPLKsuqqQ4qq3adO/VG+HTtW5syZLZ3xW8NzedVVV5Uu+FxRU9L06dPla5zPv/zyi6y22mq4l1pTuuF3symJDywn43owadIk6devnwwBlk21g/rYdkycUVOe43c7fp6OvGaULLvsskrfWptgX2P08frKB8/ZqRLf8G3sA96ysjLhX1ukV155WR75x2hVfc7Z52q/aEk7+LtShQX7QurUqZM+yAr55uxPGHG8LMans/A5h/n4nENhf88hHvTR2a23/7385fSLLPCLtfz777+vF5lQ1FGDv/fffl1uu/4yqVjStA+Y84J0+HGnyU677yvFFvg1diVM/nj0bOJN7bTp0+TPxxwtHE0OiSN5Bx8yXLbZZhtZYfkVQrHup037Sd544w296eIIYUgc9bv77ntk+eWWD0WN2jd2JLNRwkA0/NBD5Msvv5QVVlhBXnzuhcayFTzdwkULZatttlY7h+2zj1x84cWRzfXVRUQd7GDhwoVy++23yhdfflFrISHeoP3611vIEYcf2eAP7ceffIx+/fecDzw23GBDOeqoY6RPnz71osuR+meeGSNPPPl4LVvIuOsuu8mBBx7UoC288b3z73doEJutkP39uGP/ojey2XW58meffaZM/WkqHtZ0knvvuT8XSUGXnXLqSTJz5ky1kUHvBedfVND2tqRxn376iYy67lpVMXz4n2SX3+8SqePN5R133Cbv/b/3orL4wSabbCLH/vn4Jgc+cRktfTx79mz4NzLj/ieuc99995N99h7W4P3i00//nzz97//LuNkOchgIn3XmOQ0GwpMnT5LbgefkyZMDa7TnQ9Jhw/aVHXfYKSqr66ACDz3vvucuee+9d5WE16S7/n5PLfJ7771bXnv9NS2/duQo6Y+HTq2VeN069LBDGq3umKP/LNtu+9ta9BdceL788MPEWuW5CrbAdfmEE07MVdXiZWPG/Fv+9dijquess86R9ddr3kymxhp68SUXZlzLd9759/KnQw5tLHtOusOPOFR/Ywp+xC930HchTuLaTw5yetpBCnkSfvDBBxkXv44W/I15YrQ8cu+tGS0+dM115Ndbbidrr7+xDFhpFSnDjczPGBGc9P138uarz8lnH72PKZLp6YQHH3lChoximOq5YA6mRMZ8yAAglmnqN/v4JG7fffeREMB179Fd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a66VnyHX2p8h+rMENpxz+vMDP2+PecQR5vDDDir9sWZgsMzccPr0/62W+O1/yGM34jKL2T26Ej+M1LZxXxMPWwhcFeHTyJHhqUbKqI5SwaFlhcSvJVA9cyPxcxNC4tezE5PpEAEiQASIABEgAjOPwICJX3FuRhKhKe/2hd5b8rcFX/CHhCjMNQKN52P36/UbsbR9NXYnjas9SPwakaWRCBABIkAEiAARIAKdEaglfg+xO343zPSOXxELEr8iHqzNKQLVPMuDQeI3p2cFh00EiAARIAJEgAjMAQJzQ/ziXI64BDQ6LqjEHb4FhZfB6xAg8atDhnoiQASIABEgAkSACAwagVriN/v3+NXNG4lfHTLUzwECJH5zMMkcIhEgAkSACBABIkAEygjMIfErg1DUTIcYxvV1lIr9sEYElgCBxtORl3ouwYywSyJABIgAESACRIAILAoCJH4lmEn8SpBQMRwESPyGM5ccCREgAkSACBABIkAEOiBA4tcBLLoSgZlHgMRv5qeQAyACRIAIEAEiQASIwDgIkPiNgxrbEIFZRYDEb1ZnjnkTASJABIgAESACRGAiBGqJ39Be5zARSmxMBIaCAInfUGaS4yACRIAIEAEiQASIQCcEaonfcJ/q2QkfOhOBYSFA4jes+eRoiAARIAJEgAgQASLQEoFa4scdv5YI0o0IzBICJH6zNFvMlQgQASJABIgAESACU0Pge98/29x5512leJuQ+JUwoYIIzD4CJH6zP4ccAREgAkSACBABIkAEpogAid8UwWQoItAbBEj8ejMVTIQIEAEiQASIABEgAn1AgMSvD7PAHIjAtBEg8Zs2ooxHBIgAESACRIAIEIGZRmATPtxlpuePyROBagRI/KpxoZYIEAEiQASIABEgAnOKAInfnE48hz1wBEj8Bj7BHB4RIAJEgAgQASJABLohwEs9u+FFbyIwGwiQ+M3GPDFLIkAEiAARIAJEgAgsEgIkfosENLshAouKAInfosLNzogAESACRIAIEAEi0HcEeKln32eI+RGBcRAg8RsHNbYhAkSACBABIkAEiMBgESDxG+zUcmBzjQCJ31xPPwdPBIgAESACRIAIEIEcARK/HBHWicAQECDxG8IscgxEgAgQASJABIgAEZgaArzHb2pQMhAR6BECJH49mgymQgSIABEgAkSACBCBpUeAO35LPwfMgAhM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g8XlATaXTTaxiobjpyuukL7hsveDdpQccnft6+wLL7X2re04dxIXhH7A/e9n832A2XKLzfNmoX77nfeYS351Tai3ER6y967m/lsX51XzQHvJ40Euj6Z41910m/R926q7zF33rDab32dTs7XFZx/bdt89djbLly9ram7SPvffZ9fac+2Ka24yN96ySmLtuuMDzG47b98Yl0YiQASIwFARIPEb6sxyXPONAInffM//Ioz+zrvuNR/93HdG9rTrjtuZRx/5MCEDdc4gHt/6wYV15qAHgXnJMx4X6qlw5933mq+deV5Y4Kc2yJttutw8/piDhVDktrSOOF8941whjqk+lR/+0L3MsYfvX0vcTv/hhWbFZc1kCiT2RJvP3g0E6WOfP8OAmOE4wfruv89uaRoit+lr+223Nk9+3BHmflvet9T+6utvMV/41tklfZPiKTbWHrvuUHBJ83iozRNY1x33rl5r/u+s881V191S52K2snP9xMcc1kiy0z7xR4ZnnPRIs2xZmUyf+eOLzc9+eaX0dcRB+5pHPPzBtf3SQASIABEYMgK8x2/Is8uxzS8CJH5zO/df/+a95uyfrDHXXLdBMNhtl2XmqCPuY04+sbzonwSktsQPfWDn5uRHH2r2srtuVcekxG+t3X38+BfONHffu0bCYycNO1Igeytvv8usXbc+dAsygR2lquOe1WvMp758luw+pfYtNr+PgS099rTE5+THHGo2Xb48VYucEpKSMVEgz+MfcaB52L67J9ooTov4ISJ20p524tF2V2yL2IGVFpv4Yaf4f776fdlJTRPZ/D6bhd1N1S9btsw89YQjDf54UHXkOB92wN7mmMP2L7mS+JUgoYIIEIE5RYA7fnM68Rz2wBEg8Rv4BJeHd9NN682H//Uuc8VVkeSkXns+aLl55cu2MjvsUCYqqV9bOSd+pzz+SLtLc1+zbv16c8PNK801N9xqfpVcvomF/bOf/KjKXaeU+GGn55THH1WZxiZ2NweXSObHZVdeb77+3fNFjV3BpzzuyLDDCNJ3xo8ukss24bDHrg8Uex4D9W9873xz6RXXB9PhB+5jsHuFS0RB/HBp67kX/SrYH/fIgypJW0pIcFnk8UcfKG1AenB54vk//3UgPhjvi2t2MbsSv71229GccKzbabt15Z0GuPz8sqsD8X3wXruYJzzq4SF/CMDnDr+rqIYf//SXYe4Q85GHPkRNUm5tySNIdXqkY27a8fv2D38mOWnbA/Z7kDnwwQ8yO2y3jcFu6+UWn7POXWHWr3d/uABhfc5THl3qD+3TPjXeU084yuyeXcpJ4qfosCQCRGDeESDxm/czgOMfJgIkfsOc14ZRvf0dt9eSPm0G8vfmN26j1YnKnPi98DcfK7tKadDzLv61+cF5lwQVLpF81BEPDXUVUuKHhT5idTlwmShi4DjoIXuYxxx1QKE57tEDMcS9e7gU8EmPPaJ0/xguqQTR0qOOvHz/3EuEuMFvt522k100baNlSkiq4qREFW2e/9THlO6Zg74r8avq67vnXGwuvMRd5riVvdTzxU8/HqEbj5Sc7W+J6wnHHtLoD+OoMcPnLkvsPvq5M2QeUMcO8JMeezjEwnHxpVeb7/zoZ0GHXVEQxPxI+1QbiD/+wIBdWj1I/BQJlkSACMw7AiR+834GcPzDRIDEb5jzWjMqXN756c+5e8FqXIL6tN/cYiqXfbYhfugUhAtEB0cd8ZiU+KVEBQ9yefoTjja4h67LgV04kDocm9rdrJee+vjKXSbsSuk9cbib7On2vrL7br6ZtNOPlJBUkTHssn3kU98MBOg37OWnVff6TYP44aEmn/7aDzQ184KnPbZ0uWcweiHFc5rE74IVl5uzfrJCesFlnC899XH2gS5F7DQXYIzLUHG0IdjaDuWeu+1gnnz8EUFF4hegoEAEiMCcI0DiN+cnAIc/UARI/AY6sdXDarPbpy2ntevXlvjluzcvsYRqy/vG3RjklRI/PIDkmU86VtMtlJvZ++lAyvJjhd3tOz15OAxi7Lfnzmb3XR5odtzu/iVilrdH/f/OukCeCAoZDwo57YnHQBzrGEX88ATTr9oH0eiBB9ZUPXlzGsQv3V3EPYW/9cwTDJ662nQsFPH75vd/an7x62ulazz581lPelRtGrjc9JwLLxM78n35s04s+aY445JajQ1HPFDokP33lDYkfiXoqCACRGBOESDxm9OJ57AHjgCJ38AnuDi8V79upVm3rnHSQ4NNN93EfPDvm19HEJwbhLbED69VwMM89HiWJXXYlUuPlPil+lw+6uD9zFGH7JerzQb7GgcQKTy2v+rAKw1ABPez97illwCmvp+3O0zX+B0mPD0TT9Ec90gJCXbMjrf3AuJYu3a93MN2nt1dvG3VnaLDEzdxaWLVMSnxw6WtX/r2T+zTM2+W8LiP7pm/UU2q0/4Xivilu3ijdhJTworcfvs5Tyg9SCfF+Wj7pM7t7Osr8GRXHMvtjuKplryDYJL4CST8IAJEgAgYPtWTJwERGCICjRzAPTRhasO2fTV2Jx1Ve6y60V32NbVc5jRQn4nfHXfdY/7T3telx6knP7L0iP5JiR9i4x1+Pzr/F7Lro0/31D61lAfH2Id/gCDkx2e+/kN5KA30dfci5m3q6ikhqfOBHpc5PvG4Q2vfK9eV+CHmcUe6+xtvXXWHPKDlHv+kU9hAmkGeRx0LRfy6YIyHA33+mz8Oqb7stMfbndviTnGKM4jfkfZVDWf8+CJz0S+vknZ4EBCILi7h5escApQUiAARmGMESPzmePI59AEjUM2z/IBJ/IY2832+1PNyuwv3le/8JEBe9RCYlPjhfrlHPPwhwT8VsGOFyzCbDuxyXWV37rB7d8PNq8z19gmj2BHUAzt+L7b3li3DG86TA+/uwxM3cTQ9+TNpUiumhKTOCS+2x5NQ8xehp/7jEL+0fSofsN/u9tURbucx1VfJC0X8sCuLy1xxPMhehovx1x14IA0eTIMDc/Wq551cck1xVuKHp8r+z1d/EHZU8VAYtCfxK8FHBREgAnOIAC/1nMNJ55DnAAESvzmY5DjEPj/c5ZyfXWZ+fMEvJVlcfvfyZ58ol+HF7Iv3+I3zVM80Vi7jHX8/sDuBP/uFe7Il7Lh/LyeQZ55tX/Ltfe631X3Ni37z+DxUqN+y8o4gg7jl7/JLCQkeTIInjeIAwQURxoH7EPE0T7zjsO6YlPjh3ridH7itvGz9kIfuWddNSb9QxO975/zc/PSSK6Q/3NOIexvrju/YV3BcfKnbucO7B/FQmvxIcVbiBx/Mz6ct+cMucH7wBe45IqwTASIwTwhwx2+eZptjnR8ESPzmZ679SNvs+k3rwS7oss09fvD5zNd/EF6IjnfCPen48uP70x2/rsRvA3b4/D1syAvvcAPBTA/sAv3H/34nvCAc77LDO+3S44prbzJftvfD6VH1PjjYrr3xVvO5/3OXIOLJoS+15CV/4ExKSNKneq66427ziS9+NzzN89jD9zeHPmxv7bJUdiV+u9mxn/BIf2+i3dDEpa14oEvXY6GI31XX3WK+ePrZIZ0n2qeZ7vOgnUJdhbvuWW0+9eWz5N2J0OEhLXhYS36kOKfED34XWoL5XUs084PEL0eEdSJABOYJAe74zdNsc6zzgwCJ3/zMtR/pUr/APb+E81b78JJv2Fc5oNTjN+w72/a2727Lj0mIH2L915e+Fy7te6x9WTpeCJ4eeEffx79wZiBceGE6SFF64HLQj372O0bvD5T3wdmnTm6RPIEUL3EHOcQrEnA8bN/dDV7inh8pIUmJH/xSGy5rxU5W3VM2uxK/vK88r7b1hSJ+uAwX93vilRg4MG48wfX+9rJXPUDkP2+J9XU33aaqyh1aGFMsc+IHOy4x1h1W1HGQ+Dkc+EkEiMB8IkDiN5/zzlEPHQESv6HPcO34cNnn2T9ZY665zl3mttsuy8xRR9xnKu/uSzvNd/xwX9xm9lUL69ZtMDdYYnSvJUnpgadqnvToQ1NVkFPih92zPW2sqgMPQ6m6T+28i39lXxT/C2mCHa6H7bub2dVeYgn/W1feKS9c14ecND1FM3+SJIjJnrvuYHbZ8QEGu3WX2vcR4iXkejzDvsNv5x3KT0hNCUlOxkBCP/HFM+19h+4/KR5IAtJSdQyN+GGMV157s33S6DlhuLhMdvedt7PfD5RLNK+45sZAvuF08P57hAfWhEZeSHGuIn44Bz9pdw7vtjuIepD4KRIsiQARmEcEeKnnPM46xzx8BEj8hj/HSzzCnPg1pYPXIzz26ANK98Jpm5T4qa6qrLsv7N7Va+Ux/rgMs+nAfXW4vDC/vy9tc/ZPLzVnX3hpqirJILgnHntI5UvX4ZwSkpz4wZ7ev4ZYz7e7fvm7DeE3ROKHceFF7njSJnYAmw681P4Jjzqk9rxJca4ifoiNl8DjNRJ6kPgpEiyJABGYRwRI/OZx1jnm4SPQuJ4qP/BgIkBsX43dSfBqD77OYSLkl7RxE/HDTtlWlmSBYMnu247bNeY6KfFDcJCIs+0Lv3Fv1+o1awv9YRdxN5vD4+y7+aoIVsHZVi63T/fEQ2n0kk61Iw5eCP+Yow4w221bfiWE+qWEpIr4AbuP2UtP9WmjdbtaQyV+wAmvawDG+u5ExQ4lHphzyP57yW5fqs/lFOc64oc2PzjvEnPexb+W5iR+OYqsEwEiME8I8FLPeZptjnV+EKjmWX78JH7zcyLM50hxOeYt9t5CPNETl3aCSIzzkBNc3olvEEkQPbz/b5w48zkL7UaN+/1W3n6XPAAIl+ZubZ+oijnjQQSIABEgAtNHgMRv+pgyIhFYegRI/JZ+DpgBESACRIAIEAEiQAR6hACJX48mg6kQgakhQOI3NSgZiAgQASJABIgAESACQ0CAxG8Is8gxEIEcARK/HBHWiQARIAJEgAgQASIw1wiQ+M319HPwg0WAxG+wU8uBEQEiQASIABEgAkRgHAT4VM9xUGMbItB3BEj8+j5DzI8IEAEiQASIABEgAouKAHf8FhVudkYEFgkBEr9FAprdEAEiQASIABEgAkRgNhDgjt9szBOzJALdECDx64YXvYkAESACRIAIEAEiMHAESPwGPsEc3pwiQOI3pxPPYRMBIkAEiAARIAJEoBoBEr9qXKglArONAInfbM8fsycCRIAIEAEiQASIwJQRIPGbMqAMRwR6gQCJXy+mgUkQASJABIgAESACRKAvCAzo4S6bCKbusy/wLn4eut7vCw59y2fcGdFxGBOlcWMtSrvGNDdMNwXbV2N30lu1x6obV0w3F0YjAkSACBABIkAEiAARqESAxK8SltlV6vKaxG+6c6i4tqE40+15zGgx4YoAJH4VoFBFBIgAESACRIAIEIFBIzCzl3puYvpCbQZ9fnBwLRHY2GLPq2Wo6biR+E0HR0YhAkSACBABIkAEiMBAECDxG8hEchhLiwCJ3yj8q5koL/UchRvtRIAIEAEiQASIABGYDgIzc6nnyB0+bgBO54xglGYEqvlLaBPNUQrGxRQau+elnos5FeyLCBABIkAEiAARIAJ9QIDErw+zwBxmB4FGQpXeATjCcaFH3Ng9id9Cw8/4RIAIEAEiQASIABHoGwK9J361O31VO3ybOGWVqW/AM5/ZQkB4VPwoJ19DtJbsEtCafFziJH7lCaSGCBABIkAEiAARIALDRqD39/i1I36W6rmvEbM1FErYuKofgcEsmPN56sd4N4Y0ghDBrFDBSOKnEFUDxHv8FB+WRIAIEAEiQASIABFYWAR6u+NXInw5F7C4bOJ3+IT1TYJTRexJwi1Y2+q184J1x8A5An4CknlwYkmRN1x8ApikVErGcMevjAk1RIAIEAEiQASIABEYNgIzS/waSZ8ncpHPRWlY01miHRMNry1KtZyi1uDTyjqI1ShNNIDOjasTLmmDIgjhZr6o8VJUFLJZ9J2/mjxcUiR+hclhhQgQASJABIgAESACc4BA74jfyJ0+u8sXaYKTwsZfYsHcRT8/kyXFjM5wtqjPqmMPqi08o/ur8yj2UKxVTVjNUPLwpUAt23V2cx2XLvn0+RTIXZZjrEappvvpqBu7IfGbDsiMQgSIABEgAkSACBCB2UFg5oif2+nzK31bOMl/erVq65hfcJudeSpkWiAYsJQW+aqoGWmNutBJU0XDlzt2rdRe109k6lkvrkFdM3XW8Fof5a9+sV2U1FZZBjcvhMIJjgAGpYQIc+PVGjdWo6S2BSkbuyHxWxDMGZQIEAEiQASIABEgAj1GoDfEL93HE7yy1Xy8tBNWa5Qv5xR4hBdKsUZNQNbXKPcltTcu6DUzdVrYgQWSo91qOaL7zvOjcUeVTcPVnEbFqLCHcepWn4+l+o2J3pmSzhIRobVNRTfTVWX9FoOT+BXxYI0IEAEiQASIABEgAsNHoDdP9SyRgWwRn+70OX5nW6hPTvi8vhSzZj7FXWPV+PRBrfwizyWu8aNU9JnW4Gri16iLOdhalkbb+SnFqVHUzaOk1zbHJHYgadrWT0Cqdyar0U5sqToJ5SohamgbNAskZP0WeyHxK+LBGhEgAkSACBABIkAEho9A/4mfJXWRL1hJvrwOhM/XZaqsDIUUIumH0+MzHOoUFH0TNMFsBR+qXrBFUC3REEaTGTcWHZGmGYi7KDKrVtsOTv01eF0Z4gWh2tOaix5+lGB4wVaUZefPN3KFr6CHRHTVTFGdxfjaxvAkfuMDy5ZEgAgQASJABIgAEZhNBHp/qWe8xNOu7OXLEjtZ5KP0q32t+zmIemf3XsUZqlQWXZa2pglmK/ikmohJqrlW4yQuJTFvU3IoKoJ7EMRe2pH0XccMcoWrR3vSjSqLXSQOmaj+mbpUbREvunhJd/pCFYLu8kFU6gudtbkv37U2KmaiLYraKdZ8t9URSfyqcaGWCBABIkAEiAARIALDRaB/O37ZAr72Ek9L+mRvz/rnZbrrF7b/olA5m1m3lT65sm5tncdq61eIr0GyxrEaJWmXVQuxplQpd5FpsmoZcjcoHZqkFSpBGCvbUa3z1GInNZZE7UQlerYmX/go65T4Ib62k75cJXRL4ueg4AvcwylBgQgQASJABIgAESACC4pA/3b80hW8kjsLQdzlc5WU7InNfTiu4WOIT2gLHIMBlR4e6eDz9BLmoDtQ6pKYVNWmHN1shEdmzqohhTCqTMiqdna8JhhCiA5CVeMss1B1QqhqL14R9Iq3ln5LT8jbSPKXB3OdkPg5HEj89KRjSQSIABEgAkSACBCBhUWgB8TPLdTDct0L4XJNTwbA65TsgQXCLv/gr6RP2oqXcDxXlU84LSySU4heyLBQscEtfwhERPpKaonYJY0S+RgRp2wua6r7d4MJQ/KCnyk/NcFaHaKFtilCfaYVFlF5dKwcPawuJ3ogg9D5CRIJOhzSNspO6T7FP1VMW/bdVoflpZ7VuMy3dvUaY1avM2bt2o1m3YZNzLr1G80Ge6ro6Tzf6HD0RIAIEAEiQARmH4EeXOrpluth0e6FAvGzupTkCWGwumXCBsUSyINTaTRXam009wue2cw2rqIz3y7Vuv5GxXD5TL4gy8aVVZXylNRIL1EmYmXiOkrh5/CIgvirffT85OFDy9zQsu4yr8dR7VoirKVsaIAv33DjRqyOxeIXyd4H3tLU+adJkfg5NLjjl54Viy/fda8x99y70dxjSV/9/4PFz4s9EgEiQASIABEgAtNHYMmJX9j10bH5tfwo4ic7fvDdZJnjC5ZMCOlDzROLwC+6MwrNZlHKmGdzd/ULM2EXsbFWc16keu+ZVWP7INV4BLUTQjW0KwphjkM+TojjDoZiw5a1GGdEA59ofb5FS8Tb6vFlFeKBUuSox6pZ/jkHsSMbq8YnPtzhRR9JtdMvky7LwbnjV8ZkfjTr1xtz5z343mjWT/lUmB8UOVIiQASIABEgArOHwJJf6hlIgWLnOUBK/LCwF79l+JSKlJuEuouCOjxxODLgZKmHDwhNR2zjvBpX0E2BWth8X7bIe61q7EgELC6nWK/ybqNLxubFRFMToNpRiUxpHIGVFS3jz0+alosZukhNVXIpdaeox9GOKgDiZauQsaK0tkgAvR1WscXOfC8uo6D2QlWe09A1hp/yat/21didjKfagzt+05jsdjFwvt5+lzGr7qqei3ZR6EUEiAARIAJEgAjMKgKzS/zsal92/YQIQgbZAxFwckqllBhEMjlqupSkLPQCSfsZlU9ud3lhIeeOIBSreXjvlnlrEFtWWMZpk0R0okskpKMT4v202n5+tIMQURUdSze4HMdYRzgldI7kge1JK3t5J/xI/ASiqjMnmwt/ImVaEr8MkAWq4pLOlXfaHT6721d33HvvBnPzLRvt9wZz28qN5vY7Npi7bbs1a6rnri4O9USACBABIkAEiEA/Eeg58bMLe/lyO3r2pj7QOjA8T/SyyzyFQTibEr/upCInE+MuevI40z4BXF6RpNTlqXkU7bFdnlfRT1f0mTZpVG9xTq5/zUImLmldnp/gmXi1FzWetqgfZ/Bwgh+Gp3VC6tRDyR9InspSboC3/SdqlNGucsQvdCBh0W5Bj8bw3PFbUOx7FvzW2zfKpZ1Vaa1da8yVV60zl12+3lx3w5TPi6oOqSMCRIAIEAEiQASWDIFBEz+hEJ4J5IRAiSEW8MUjJx65vehdX8vj1HtWWTTf0HsQcm9vKBagx+7wQiRARcdy2FF2DVxuqZZi6RKI+QTJ5ViYn2grxmhfU9zyFnH8JUtBEfysEEfoyJ2SOedjdSR+DjsLVMSqAGdSqfbgjl8C0ZTFdXZ375bb7ZM6K3bssLu34hfrzQUX2cd4+mOLzTeagx661uyywxqz1RZr7d/Z1to/Zqy3T/YkIVSMWBIBIkAEiAARmGUEhk/8MDuWDQilmJRX+LWrLmFDuCDkp0KtIXesrIPESF/aYaVXMSl1DT17IRAaXaJbR/WNYatjRbtK5ZZqKZchk2QOnE4+/YcrnL4co70mxoxt4tijLkrJWKzoak6IFhK/iFeFFHCrsAVVRDOorEDil6IxPXmN3cm7aVX1pZ0rLllrfnRuJHwnHbfa7PTAu8zaNfaJLzyIABEgAkSACBCBwSLQ86d62mW8fHnill7qaadkk2U1l3piunQnSaeuxClUUb0g1WaF0rtqC43gGE3B01aCtWjw6rK1rCk21JrrvUxmNCv1qy5r22Vji62zuMEv08cGIvkZS2Bw44s7cr6u7XS+2sKg7epwDvZcKOYd8QgDkwbRy0nw445fjqWvA5saU1RXe5D4RYSmJQnps/fo5U/svP32DeaH56wNl3Q++6mbmj123WiWyUOxptU74xABIkAEiAARIAJ9RaDnO36Azd2zJ0TCkgN5AIglB6hDzusFwhdZxqLiX8tdRhiCOQjFtEskRc1+Ta1L67y56tU9lsWG0a+o12V9sAchRipIPgHMkRwhISfEafF1bRz8VDGq7Ng+DKs4gIhr3p/zc3bs+tm6fDlZ9PYD/6wRX/ZQm1S8v9NL9KD2gigX4KMx/JQv3bN9NXaXDjwbKolfBsiEVVzeecNt5Z2+q65eZ07/rt0GtMeRhywzxx+zzCxfPmFnbE4EiAARIAJEgAjMFAJLvuOnW0Jhze+F+IRHkDtH9CBUET1HJLyfVBJCEAKn85IrRy9bpbV3U+8QJQjaR0mhhsYytApC0d0Ri6KuW00zd63K8Zzd7WxZn6J7Xi07KNHzSYVhWEFkN1HW6iyhmrXzzVsXaT+Njfx4smElTYqWiI/TAxenS8idNdma/aiwIbLYvVAoXEyoFuRoDE/ityCY9yDoDbeV7+m79LK15qwfu0s7X3jqcrPrTuF/TA8yZgpEgAgQASJABIjAYiEwE8QPvAC7R47TiWQVKG3h393nSITzEYusbRZqgaOr6ur41Vok2zStjcasofbv1b6q2jyS6rMgtpo2FPoiLpHwaIssQlZVr1CGBJyQVR15F+dqe4jTSgjRW3k7p+IAyuPVUIqPw6ZI+uADsmd97He0iVZ0JdLnmkjwiLZUp/9RHGIWn8QvA2QQ1aqnd6ak73detNxsfb9x/r8MAh4OgggQASJABIjA3CPQA+Ln5sDROCv7dUm64wcd7EXiV61zWh/TscEQM862Ln4aV8fRPXPTRXuec2yg8aOmjRRaBaHYypGLoq5bzQ8kFEGQMHGYRb32Ee11mmLioZYJcVq8IbNr9LZl6+bVw0q6KY4w3fl0FvvpSZ6cA6gKu7Of4uBK1RWInwsQ+hKfUFsAIeuv2AOJXxGP2a/hPX232Ie5pEd6eedrX7ap2eK+qZUyESACRIAIDBGBK664Qoa15557DnF4HNOECPSW+GFcY5E/aeg+AiFAtcNRXD61a1jqq6Soj+NcfYNR7UJyHalDaOfyiFUvRQX4ij+iJIpQDYI6Fktldl4bCDLqYXyFUSd6FYNjMXaoaQ7eb5S7ttNmjrKpNpbBDlKHwyts4QhdXlqtuLjS+Yizbx3bi8J/iF+qmLbsu60OS+JXjctsanH+XWtfvJ6+nB0Pcvnsl1fLgLjTN5vzyqyJABEgAuMgQOI3Dmrz02bJH+6iUBfIAZS6nnfbfFKHj6jxYfVSs7LXOqKY1J2z9pAEDarG1bHzauEyup/QYaUgY8otubIijwpVHiWrZy18NWqjJA0do1HqEzhQFrRc9bmHIdQRwehQiBHUBW3LSl3jbGiIVlZlGl9VklbcAbRG4OO+JJqrRr3rw9ad4Er/qTELymlWfLfVIUn8qnGZTe2qO+1rMe4qTvg3Tl8tT+/kPX2zOafMmggQASIwLgIkfuMiNx/tZoT4YTLsit592UKFSP6U/gWOEQSdyA6MQJugLK6nEoWPVwpbUqTRRB7tYd1yp1IepbAh1eamWSBP7hAtESV49IxSudd6jRJy9ShMSajEbKOkLcYo64LUDKGszjRSdTrFR3f1tA7g4KF6nYgCuSuFzRRjDLWxSWN4Er9G7GbIiF2+a24uTra+pw9P7zzh0ctmaDRMlQgQASJABCZFgMRvUgSH3b5/l3oq3rqA9wRBSYSr+hoq8uWdQ+GEwC00prCp4iIpmHLBurX0dPce5u1T5ubzKrm0UmjjttlUBA1NgyBOgbj4JtEaJedYEbONSlP3vjqH2rQ4P9Y581e/RSllyNXjVm0gcgBOvpxFcUyJX/Stzj7Yq82TazXpykgkfpWwzKAy3+27994N5r8/6y7x/KNXbspXNszgnDJlIkAEiMAkCJD4TYLe8Nv2n/hhDixDcJzAf0qh5M/ZxU2ZQ4lA5IrGVTFCuWOUWx5W20mpOReUS1rxNKWcQzbOWI2SNArVIGSxPCAZLiUkRtmzqAtdLY8m04SqFdyXTSnKgcR5Qoh8o646+2CvNk+uDTlXhSLxq0JlFnXX3FR8Ufv5P11rLrhoncHL2ffafRZHxJyJABEgAkRgEgRI/CZBb/hte3Opp0JdRxIKD3qBsyUP6ht2jrygeo05aVm3SB/ZT0ZwJs1j4vY1ZKA0vuAXBNd1Vq3NJx93mCDXoha3vF1tBwtkqB2fM+jOXkr6hOKJ2X64L5+cawNdepSwTo3TlLN+i6FJ/Ip4zGYtf5LnWvt+9k98+h4ZzBtetdwsk1fdzObYmDURIAJEgAiMhwCJ33i4zUurmSF+mJAq8id63Q8sEQevyPWlRXFJUT3/6pbHy70zopObl7weGUwxFT8+HWbRiFq9xflWAxO0QdDIXlHSq32JyjDMILhEfFW1QuKkYj8KNvWwzRIRQUj8HJT6uerGFSqy7IjAzSs3mrvdVZ3SUt/Zd9Jxq81hB2/VMRrdiQARIAJEYAgIkPgNYRYXbgz9J346diUHVbt6gT+ok2sUakHwwUqLce1ksjJ0E4TJ4i1Y6wJJSXtxhgye6FBriC4iZeOP1SjBL9SCkMVZqmpbfJRAW/8ITXXjkn2hxxY7rOiJO34VoMyc6qob7Z8RknkOT/J8+q1m1112nLnxMGEiQASIABGYHAESv8kxHHKE3tzjpyCPvAwwED+0yBiDr2ZaDT2yTNZQI32rHOr7rbdUxZm+rnpk1Vrbe61hzMyy4WdVG7Ssae6pLsG2ceraV/da8tbVdmJwYkkRAkZLlIJxIYTGbkj8FgLyxYy5eo0xN9wWJ1kf6rLF5hvN00681vDFvYs5G+yLCBABItAfBEj8+jMXfcykdzt+SgJKS/gaRbyqsuTQR7zb5VQ3lLjOaxdnYq9JO6wbyIjE8maTpjGiu/Zmn0ihyJLLqho7qqOktgUpG7sh8VsQzBcx6O13G7PyjjjJV129zpz+3bXmqIevMfvufhOJ3yLOBbsiAkSACPQJARK/Ps1G/3KZeeKHzaLIE6LUP6hnLaO4qJws8wHNie70WUAiOlESnLKqYhfVUVLbgpSN3ZD4LQjmixj0llUbDR7uooc+zfOpJ95pttx8FYmfAsOSCBABIjBnCJD4zdmEdxxuj4hfNUEoaUsKP+K49dcRgqV3rxtSXWaNa/q6Rl31oZMgdIyQjSqrVgUb5TJuJlV9jaUrJFCoxHBeXWONfgl1TJTTExsTaDS2yCFrb6uZpkUM57Lqxp+39qVjROCG24xZvSaifvoZq81V124wzz3lNrNxw90kfhEqSkSACBCBuUKAxG+uprvzYEn8OkO2cA16RXzCmjIIHQeejSarNgXLXcfNoKmPsWyFRAqVGM6ra6zRb2yqlIRoEhsTaDQ2RfW2rL2tZpoWMZwLiV9rqAqO19xs39+3Pqo+/+V7zcrbN5rnP/VGq19L4hehoUQEiAARmCsESPzmaro7D3YJiF++rO+Wc/uNvbb9jLtkzfNu259vp+7avdbzsFpXP61PrVywwCMyrBlwrl6q9ErZt0skuRq0FKGoaBev2GZatUn7ztrbaqZxiVYqi2Mg8Svi0baWP9Hzvz5zr1ljdwCfd8p1ZsOGDSR+bYGkHxEgAkRgYAiQ+A1sQqc8nCV4qme+su82IhK/bniN9m6xOh8dZAyPmvMgVy9VeqURtUuExC8BrgVkJH4JXh3EK28ogvsf/+Ve3P6cJ18jUfhUzw5g0pUIEAEiMCAESPwGNJkLMJRFIH75Sr7lKFo2q339Q8tuFtyt5TgWPI/iOnHBu+vcQVucuo5D43Zt13IAi/ZC9pb5tHOrAaM9ay12Y8PVRCz6FWquxaobeI9fAZaWFRK/lkDRjQgQASIwZwiQ+M3ZhHcc7iJc6qkr766ZtfHvPe1LHznaZkAL59N9Zb5wuVRFbnuadB2Hxu3arirHCp0Lu0DBK/qbjqomXxK/6cC7CFFI/BYBZHZBBIgAEZhBBEj8ZnDSFjHlBdjx05X2iFFUumXKrFqOONKh3IQaIjAuAuMSo3H7q21XQ9xq/XPDpO2zeDbcyJ3Pmi5X3XBxFozVNgiQ+LVBiT5EgAgQgflDgMRv/ua8y4gXYMevJRkruBUqDbtkmV+XkdKXCEyKQG+I38QD6RighrVpFCF+WqkpSyGcgsSvBq8RahK/EQDRTASIABGYUwRI/OZ04lsOe4rEr4aUVaq9MtiC0DJtuhEBItCMQIlpJe5NtsRNxVHu1l7tUq3VsChXXX9RWqXcEgESv5ZA0Y0IEAEiMGcIkPjN2YR3HO4UL/WsIW8Fta8EXRCytHO/zMwqEZhnBEbzqRHobBhh72geh/j5May6/mcdO6M7EOgb8cMrJDZJHrm80e6Op/V01tSmZZ1f2mae5BRLxUjHj3p6LFu2LK0OTgYWeqTnieIAncpVWMCGb22rvlrXUvuYh1IxyMc6j1jkGAylTuI3lJlcmHFMgfjVkLdUHRYEqTIZULAnukaxJk5jGxqJwFAQKC7+uo9qwvbZ4hPbfeNGXHXdhd3TZ4veED8sIt/61rfKwjpdYK+3b5e/88475fuOO+6wL5VP3jZv52+zzTYz22+/vXwfc8wxBt/3v//9wwJ9Xqf4xhtvNK9+9atl+FtvvbV5wAMeYFCmx0033WTgh+N//ud/TBXhSf1nVcb5dNppp4X0H/SgB5ltttkm1CFcffXVZtWqVaL78z//c3PwwQcHu7bfdNNNBUPgiG+cj/r9yU9+cm7OOZDob37zm+ZXv/qVnD/XXHONufnmm83mm29ugO3hhx9u9ttvP7PPPvvIeReApDBzCJD4zdyULWrCU7jUs4aEidp+aJkOq47oFfRJ3ERMw1AmAouKwLjsZlGT1M6akm2yafsOpQ2HRdY4x6prfzpOs7lv05cdP8z7n/3Zn8l8pIQknaBHPOIRZrvttjP3ve99zS233GKuvfZac+mll6YuQgCf/OQnm1NOOWWwRKYw4JrKRRddZP77v/9brJCrjh133NHsscceZtdddzUvfvGLq1wGocO5BSxwXl111VXmsssuK40L76vE+YXjgAMOKBG/z372s2b33Xc3Z5xxhvnhD38ofgceeKDZa6+9hOw84QlPEN2QP4DjD37wA/O1r33N6Dm1ww47GJxH+AMC8E2Pxz3uceY1r3nN3BDidOyj5HQ3fpSv2pdiJ3UpiR/+r/77v/+7ueuuu8xTn/pUc+yxxyoULHuCwATEL2NjhaqvFIicHXFeBwhBZ9sUYihClUo1siQCRKAzAvHyqULT8bibbPeNfKpnoaNYWXXNBbFCqTUCfSF+ecJvectbzMUXF5/U+sY3vtEcffTRwRWLpx/96EeyqMciIT1OOukk89u//dtcdFpQsBuFHb30eNGLXiSLKSzmh7rTl45XZYz3937v98x1112nKik//elPtz5X/viP/9j88pe/NG9729sMyN+8HN/73vfM3/3d38lwsbP3kpe8xDz84Q+XOnA9//zzzQc/+EFz6623ig6E8AMf+EBrXOcFR/zM+sIXvmBWrFjRacjA/OUvf7k56KCDOrWbxHmpiB/+f+H/WXq84AUvME9/+tNF9brXvU7+iJPax5WB69///d+P23yu2y0A8asgfYHceaylnhM9bZfPRx3xq9Pn7VknAtNCYFxmNK3+pxWnbhw1+hp1yMbaq12qtaGdFVZdfX5apdwSgT4SPxA67P7lxA9E7uSTTy6NDIsTLEhz8vfmN7/ZHHbYYSX/eVO8613vkp2adNxYkO+0006pai5kEBRcUpyeW1j44fxpu6OC3cNPfepTJr8kdMgAYjfvTW96k+y0A68/+IM/MNglzQ/spuKPNqtXrxZTF0Kdxxpi/cILLzRvf/vbzbp168Ya3oMf/GDzN3/zN2O1HafRUhE//eNKmjPOt/e85z2iOvXUU1PTxPJnPvOZiWPMY4AxiF9GuApVW5F6okxJX4HweZ/gqvWgcPMh1Uw3jzPFMROBTgg0kC67iJrqYcN13vHzKay66typpjIvwfpK/PALHpeVpceznvUs8+xnPztVBfkjH/mI+epXvxrqEPAX4qc97WlztaNVAMBWQHRe//rXmyuvvDKYcA8k8JqnnT4dfBXxw64ddu/aHlgkfuITnzB/+qd/ao444oi2zWbaD5fcffGLX5Qx4I8v+CNM3aHEGHYQ5OXLl9e5zpUe/wf/8i//Uu6HHHfg2EXFrupiHX0ifrgk/f3vf78MncRvsc6A5n6mSPwqiJuSvrwEOwyEzsuhniasfqkOsjjnStaJwAIjMGXCtMDZ1ofv0aWeV/ykPk1aahHoK/EDMfn6179eyLuJ+J111lnhr8Ha6KijjjK4PLTtTo62G1IJovOc5zynsMOAe2VABucRF+wmY6dO71HTue6yM/Wtb31LLmGs24HWmEMpc8xOPPHE8OCgqjHiMtrf/d3fFdM73vEOedBLld886W6//XbZ6au6v7QLDrjE8bjjjuvSZCLfpSJ+3//+98273/3uQu64z0/vRealngVolqzS4ameNWRLCZuWOpSU7KmcEj7VhRINEcT3U4qngccrfdTxGo/RaigUYYyhD7fJTE1qU7JNtorpK7lnClvNNBVBcpVrseryc3ID6y0Q6Cvxwz1p2C1Ij2c+85lCYlKdytiNwK5Eepxwwgnmd37nd1LV3MnpIlwH/7znPc9M+y/mGrvvZdWOH3LuQvzOPfdc2blp+kNE33Hokh8we+ELX2juueceaXaf+9zHfPjDHy49GTWNqQ8WAkbz+AeGFAvgh52+8847L1V3ll/60pcaPLhqMfFcKuIHcPBApe9+97sG59sjH/lIg8tc5+me2s4nyBI06LDjV0OdAnFL7KlOZSF98LHf0Im7lzHwUA8VVULh7U4c51PCj9NwzDbdF8JjdsRms4nARCfIRI0tXl3bZ/5ZFeFyVXlSqj1W/frHZVdqRiLQR+KHVzZgIZ4Tv6aF9nvf+15z5plnFsYL0gfyN8/Hj3/8Y4Ndl/TA/TPYDZ3HYxrED/dpYdew6XwcErbA7A//8A+NkgCMDa9reO1rX2t22223IQ116mMBdv/4j/9ovv3tb08U+xnPeIbBH2wWk/QhYZ3zqvs5JxoQGw8CgfF3/AKTSsgbIFGit4l9sWxO5oTwQZm0SUmg6CUIPspkT2NXmMR/hj+ql8UzPKAhpj7VSZpqsI5o1/Vdo69Rh06tvdqlWivtvGnVr9wj1kMsCq0QmCXiV7fjlz5tUAeNy6GwMJ3H+9gUA5Tp/Vaq/6d/+id57YXW56msI35d3mM4j8QPl17jNQ758ZjHPEb+iICn7eJevsUmJnk+farjXPvYxz5mPve5z02UFi6tfdWrXrUk2JL4TTR1lY1xXpx99tmyY/7Qhz600qdOeckll8j7RvGHuz78X5uQ+CUEDiNWYlYgeDB4EljQa1uU0tiVEkMUULpD42rdlplHYplNsWGJPJsDYtZLjEDDGWV/gHU7Rvhbc6VHi35WXfr9bqnQWxCYJeKHHRZ848Avz9tuu01eJJ3vDOIx8095ylN68YtRkl2iD2D013/91+YnP4n3v+I9iCB+fVg0LAUswCR/qify6HKp5/XXXy/vp6v7Q8RSjGuh+8Qld02PvN95p53NkUcdaY488kh53cC8nl86DzjPvvSlL5UuP1d723Kp71NeSuI31Pf44f5ifXDZ4YcfbvDd5sAfnPAqEBx45+jBBx/cpj607H8AACE6SURBVNmC+rQgfhnFSqspSVNyhlL18JWdP99IZak6MriJ7v6l7XXIVTq1Tb30ObaOW7nUbd2ajvONwGRnT4vWjS51xjr9iLlCM/sLc5xj5S++N06zuW/TR+KHh0lU3eO35ZZbyk4VSpA+fK9du1bmEIQGl3Xir+Pbb7/93BKb9ITG4hMPINH3qsGGp1D+yZ/8ydzikz+oRPHqQvxwKbL+EaLuKbMadyglziW8YiV/KE7V+PD0xSc+8YnmSU960tyeZ2eccYZ53/veVwVPa91DHvIQeZcdnsK7VMdSEb8hv8fv5z//ucHDyPRoQ+JS0od2eEDXAQccoCGWrByf+Cm5Q+opQUtl7PQtE/bnfGDTbxA+awvET+Noe4EE/iL4j0IlMXh9nTnx7IVYWiOXFGOmOQqAafUzZnpsFhDo/PqD0HIKwsaap3q2Dp2dR6hmqtGhXIOVl3x3tCs9SgjMEvHbaqutDB5nDuKHA4uSO++8szAmEECQP+zGzPtlntdee628rDwFaJ52qdJxqwwCg3f2pQsv2LoQP7zTDpfeDfEeP+BTdzTZqtq02fVr41MVu8+6Cy64QN61t2bNmrHTxM853Iu71PfWLRXxG/p7/LCDjss29cBO+aGHHqrVQonzCZeG6oH7ax/72Mf24o8qLR7ukpEJrQpB8xUla3pfn9oC6cPunvW13/IDQ2R/+Wdhxw8+gCmPq9B5vVbzcoQ5d0ddiGeVobVujCV8/c/o1r3ScSkQmN7ETS9SDQ4NC4ExWFqxkzx2q8FUO638+RnF2Ky1QmCWiJ/usmBg+PmP3Ru8G+srX/mKwSP206PpJdOp35Dlqldc4CXcbS8tGiI2IC9V9111uccPCza8w29oT0cFNngxOy6xW4wD/0dBwodE/i6//HIhffjjwLgHnmKJ86sPl/L1ifgN7T1+2BXGzqYeVTt/+U7f3nvvbR7/+Mf35v/MmMTPMiyQNxxpKbK3QZbvSPpQd8SvqIsxEjLoosf4rjPVWn0UR0qSV9mrS4hy67KmtLQNiiCUG1EzQwhMbx4nitSqcZNTk61iOnKil7vUhksMiZg2X3nxt9Mq5ZYIzBrxq7u0ruoBL5tttpm8aHted/4+/vGPm//93/8tnAl45cXWW29d0M1bpeqBN3/xF38h96a1weIb3/iGvM5gsd+p1ia3SXxI/CZBz8hDN3BPbbqYHyciyPejH/3ocZpOvc1SEb95eY8ffm+tWLEizFtK/nLSh91fXM3Spz+UtL/UM2VJQqS8QklVYbfPEjjs9sHm7+tzhC/Wnd7iJj7eF2yuENvjqn0EmEfoEz8b0R7uM1EvmujWuzWr3pDFKHtw9MK0x9O1/zyfOahPGaKJwo0iYiOno673Gn2NOnQj9lFOwdsJfgwrLzo9M7DaBoE+Ej8sQPHAlvyhLU2XKaLNK1/5SnPLLbcUhj3Ey/EKA6ypAI/83WG77LKLef/739+rhUNN+guqVuKWdoL3o73sZS9LVbUy3mGHGO985zvNPvvsU+s3iwacN+Me2IGvW5R21Y+bw1K1A276IKXDDjtMduzqxpzniHu+3vKWt4ga52Cf7o1cKuIHMOblPX5V5A/j1we5QAbpwz3sffsjZnfiVyBmnoAoeVPi5smekDghgMvcDxbVL7PEMPjaGNIeMFk9QgaiBxv08gEhHkEVhGiD5NXVVqettiXdFyOGWv4zNv7IjVJwtoJoq03erdGYhvJyXeYVrq1UXftvFXRYTlOGaIwLhLvh2ZjvhPf41f8HaMgxS8hXV/7smw1taKpDYJaI3ygS9653vSs8LU3Hi8sacdlU20WYtpv1EotwPNgFD8DR4/jjjy/d86e2eSrvvvtug5dhr1u3Lgx77733FiI36jy58cYb5Z12W2yxhfnQhz7Uu4VYGNASCHfccYe8r+4//uM/Sr13uZS21LjnCpC+D3zgA+b00083OI/wEJy2u+q4D/f1r3+9PKTq1FNPNc997nN79bNqKYlfz6d9qunl5C8Njkuin/CEJ/TyZ03DpZ4ZudBqJfEDYbMO8FFyl5WbgOyJj5bWOdwDiLb+G0GkDw+hylYdj0LFqtHGWXNLbJOGdV61vrUGH616DWuNzpCvi9McQtMgwFqopO41ckOCDSYJVtlVpbKmb6qngcBExG/i6epI/JpOaIBRm09iSMQUv5U//UZapdwSgSERv6qdHMDQ5cEdLWHrvVvVi9tf8YpXyNMWe5/8AieIhTpeaYHzJT1G/WEBZBr3pOEytFG+adwhyLoTOIoYY6z6uot03EMlfsAFl1RjdwoPn8KuX9uX2t9zzz3yR4QbbrhBdnNe/epX2yXrqIVXiurCyyR+C4+x9oBXPORPzdUn5PZtp09zng7xK+3geXKnZM+W8h8jJYN6KWh48qdNCXYc+p9ISv8fqvb/VdEe3IIATugqQaXxXW/KGX2tW1FYz/oFsuoKi3uvVFv9Yrlb/yXvMMiSxSlCAjV2qmsQmC5whXOjpseJ1I3pdiR+eSI5EaztKzEkYhpu5QVfT6uUWyLQR+KH1Kvuwxq12P7mN79pPvjBDxZGvtdeexnsBPZtQVVIcgEqwAF4pMdf/dVfmf333z9Vza2MdxuCxGHxnR64nPiQQw4xD3vYw0SNhT2IzM9+9jPB87LLLhPSN29Pjf3kJz8pi9LXvOY1Zuedd04hq5TTP8LgnHv729/eyx2LyuRbKnFufPnLXzb/9m//Ji26/P9CW1zeics8+/yKlaUkfkN9j1/T6YXLO3FvHw6QvpNPPtksX768qcmS2qZA/CzTyElcQvDkF3dCAIXUJfbY1sYBIbNf7iOVE4zErj7eVYpgcM7aPLV5l4z3pR6urWiCWBCK69ds+W6NYvdOak11MZhz8q65OtZVKg/PWzKD+ncua/LpHMc1GJVVadxj9rPgzVon2tpRUs65U7dxdOurHLuG+LUOmzlm1dBfQV+oBJeV538tyBTaIzAk4vfe977XnHnmmYXBH3fcceb3f//354r4YVGZP50R7wL7l3/5l7nCoXAiVFTwEA7s1KT30qgbdm+w8LrmmmsMLg3FgUeu4z4bvFR73v6QAOKHXbvjj29/uTAuXcSB+ydxae3QMEtfav+GN7zBPPKRj5TxjvrA/8/3vOc9snOMR/O/+c1vbn1p6KjY07YvFfEb8nv8Rs0Rfh6tXr1a3tW36aabjnJfUnvDPX7Z0l2q9kNZU1oKYYPN7/ShFDKInT7IXq+l+mkdbE9jiAxMpENXaF8CldensKG5+mtL0aHi/EOrrF6weqfgm/aRyGEJm6zeVacqJX14sbXY7If6uFCuVtAVKkmHKiaJRTFK6jZeGTuP0niR2mY0aT/jZdexVeskGxwrTBWqDom1aN3oUmes02ep6Umu6lbNMidfXXn+VzUKyw4I9JX44cEu2PVLj1EPdwHBw0I9PUbtEqa+Q5GxsDzttNMKwznwwAPN2972toKOFfu71GKFRSZ29PCaBlx2hwcEgaTgXWoPfOADpTzooIPmkvDpOaLED/U2l22mLzDHPWyPetSjNNRgSjzVFbtSL37xi81TnvIUOWdGDQ7n20c/+lHzxS9+Uc4tkD7cw9XXY6mI39Df49fX+e6aV8WOX82yXdT2Q0lYKD2pQ12JHGQhd5b4qS4vlfyFUmPbEofEEEGq4UP79Qrvbf2dAj/4neg/VQ+t+4q+2khbBN/QW6WgS1j8MNBDJF9H4SyW9EUXTwCVCCYGG6RY06ix9KlVKDJLUk1EaVfoo1CB2StK+thlKynvdFSjSfsbFX9CezG9Yq116Ipm4Q8DrYMkjhXxEmsLsWbHr65lehJX+dTl09jONVp5HolfFaSjdLNE/JpIHF5TgMVUeuDpenhv3dB2GtIxVslV91idcsop5iUveUmVO3UegfT3cArKvJ0/6dhVTi+9PuaYY+SBJHX3HWGHFJfRnnvuuQZ/cMCrMoaI4Zv+9E1mxSXxUfyKVZsSOzkgfX14V19Tvn0ifkN7j18T7rNi60b8hHRhZW+/pUCpdezs+TrInCd6cccv6oQU+h1BR/DSOAjvYyqKUteK2l0dns7fpyR19+FsXu9j6A8y6UHjiqPzQ8tUcvX80y1adV3ryriUD3Xrpr+UfAvhV5BDHaHhl3ahFZ8XTDoW5+YMiVnURR/nWfuZ92kdtdvaNnNj8EgUizj6AFQQoq2lpOdOS/fMbfx+JdDGjsQv6710piCdypQqlS6aN60878ul6FSMRqBvxA8P0LjuuuvkPWn5je64lOpFL3qR7MBgZLgcBk/FA+HLL/E89NBDDR6WgB2beTmA3cqVK+VhE9/5zncKwwZpxjcO/d1VcBh4RX9/LtQwh45pSvyAIe7bwyWcxx57bDifgDHuT8I9b1deeaU87AT3BOLdZEM8zj//fPORj3xEfl51GR8uGcb72HDJcN+PpSJ+8/Iev77P/6j8RhO/wC6sEJiFl0Gcwrfu/CkBdEQvEj/rK2RQ/dDW+8prHDSm1emhxCyvW731Lhz4Aa46aebrqhWd9UAZZdcitENEqaim0EVSsatW9+XWu/YHp1vH2hJ6qXjZthKr+vh2cHJtkrAqqqEmDU3RmZucNGBSauxEpWLR5PMrKtVVSs3DKWvyKLSoqvgObNHQVVXDWl0xr1o311+XTt3ESsAuzaoG1jD79Ql3sSS5lpt1yl5P6HIY1Ui4ipgFVaGiLc3Kc0n8AhgdhL4QPywa/+Ef/sFgofHrX/+6cQT77ruv3HcFgpgfD37wg81JJ51kjj/+ePtrIvkdkDsOqA7svvKVrxgsRHHJ4po1aypHt/nmm8v7oPCuMOA0Lwfwye95nObYcakedriGTP7OOuss8/nPf97g4Tbpsc0225jttttOxo4/OujrQ44++mjzghe8oPUTLtOYsybj/OpywH9WfjYtFfEDnvPyHr8u507ffNsTP8eWbP5YVttvKewvaClRh+xLJXi2lB+qST2QPfWVEu38dxpf0YINh5YQkzpkraelc49kDyRQf8gLURRntA2Cl4IGvRQO96NCSZGWjrToDxKU8s9urDhJ1862hgD+B46IiO7rhY7Sih+3z1Kz9YP2+buBp63ayZJrlav/oeiLKg/RaVIxq1rXasPofvIUQpfVAZ22lZN1zYMnqpIpmSexJfWmVKpsEzRNMqyK3EZXGplr1DqprD2qmcoHrE/G+68890v1PrTUItAn4of70jbbbDOz/fbbyzeS1p+FkPGzFvW0xENLtt12W3nSIJ7GuPvuu4efzWgzDwcweeMb3yhPqAQWio+OHXUcIMq33nqr+ed//mdZrKt96CXwIfGbfJaxo4w/LJxzzjlyP+Ttt99uVq1aJYHx3jp840XTeBIh/rCg593kPTPCUiGwlMRvqcbMftsjMAXiZ3854RdU+LYEMCF68kMEddXpLl9agjRoe+Tuf+FZQb5i3VXTunN3RE1/YEko21bC2A/bu8S00ezVqC6mtAg2mGGNR6ip4Beq6fpWFzdYLwvBs4LIKG0o2OUbYYOP85W694u9ekk70b69GlWXppXcFzRi1fTrKasP4guXIXIs6rUW1VFSW7H0/ReVnWuxFy9FRbtYLg3r2y6fGL6mv4q50fmuSijGS6yVSmdX/BPv6YoNfRvT9VLPLFhWlZPdfdSPIW/j/Vf+hMSvHrR6S1+IHzLEwlJ/fuL/iMpa6ijy/z+5Xf3mqUyxy/GQ3x3+B/Ss7DRMe+7yc2ba8XPMpx2/b/Hq8Jw3HPo2L9POh8Rv2ogOK17FUz3DCtqNVKvCLHwlsAzd5bN66GTXz5M8faqnkj4hfurjy/w+P2Ez1iYHfKygfak2qTvyBpdId1SWdERvbQgFWb8lrIvvukD7WJd+NQffryv86tUW7vdxQvCsw8YNsb4BxAFO9muD/Uhl6OyXBEFZ98MYLjiQd6GUGgz4ksxFFh9N3jVRz1hKx+g/CGLzteAX61EKxoLgcyvouldiL16KinbBwnjb5RPDl/uLNt+1X3ypPsyX18NLbSOTDd21bjEyZKVDY3gSv0rMZkjZJ+I3Q7AxVSJABIjA4BEg8Rv8FE80wOkRvwKxA/mzC3CrC/f4qV1KJYxaWl+QRhye5AiTgezW8cFWrBYJmyN2CAEvu9Mnza2PdON8l1mlWK2PSLA5yXft7OLkPlzf8mlX0+7L1kDmHIGS0n6AEEB2pA82S/n85Z6WE6JFgRzGkLBISFHph0KhxA96Gb+OSxQ2X6+MNo1QXWpfUgYXVwukRvVFJ9XGUjqNVZ9hnMbUlMjAyR1BaFPVRqGs6T7YRwq+e81CS5lI3zjXab0KK2dTj/reR3vUt3UnS4NdTE091NjipIwInrVHNVOVA1Q7rDyn+ETHcjtqqhAg8atChToiQASIABEg8eM50IRAx0s9/TLbEythVqAiqCuxC7t+0C23pMuTOyV8WndszLdFXO8n2fqYkGHC4VlQrILwuJpQNTSBmxA7T/qs3ZHBYh2Xe4pewsY4IIoSxcdCLT9k+eo/QOZAEPBPiB1kq9tg2Z4rUXfkz+36wR06tHCyxLcVaKDTQ1KxFR0j9CrLOJGjjL94KWvES0ai4aQM8b2AHOPh+7e6gjo6tJYkdx1AXauR/cQsolQOFruJUtlrtCagL53Zmu807TsQPW9Um6u6mrYbhaK2HZ1ZhUerxk1ONbaYfEWnqSprj2qmSr2dXO1A4ldGqo2GxK8NSvQhAkSACMwfAiR+8zfnXUY8wY6fXWgLU7IlCEiB0FkSB1st8fN22eXL4iB7T2gCibGCqHRktmJbeeLjSq2DDKFrlE52Jdovs/2hS/sZ7NCLr48HWY8oOU26dA0EzipBGjbIZZ6OMEB25C8SQtHBE4tr+x1JYzl2Vf8xR2vF2DwmTvI6jMX+818aplCmY8BiHbk7nVTEV+pOmbRVRY6Kd0nUiRjbq1LDWEsiZhU0i9YoxXCp5EJrB6nFyjXqGF7H73v0nQWtJ0Nu2pwx5GOVkGNd+w6tE6PaXBnaxNZFh4lrsYdSKD+mkr5tLnn7hq5CH3kbbyDxCwh1Ekj8OsFFZyJABIjA3CBA4jc3Uz3WQKe84+d37UAC/Q5f9Y5fE/GzK3VhYzoev6zXBbwnZpEIOUPYxZPmIH+WAtnvtJTLPK1dCKCU4iw+6C2P6bvSROIukC74sZi1X8UdPpA6++3Jn172KT72sk+p20Z6PyCC605Sun62mYWjkBdSxj9J3ZdSh9YeMm74NB/oS9bi8pHwE1vXPLR0kbQWI0fJebh6rrW2XKWhpFnsz0XRXKxTwU+tNWUyWXl3eV3DutLXbCFSqPq8RO+MQvbRfYZZYf6S9pKpr+dZR3WUcp/J6g1xff7l+A1tUue8fZtmeRsfj8QvBba9TOLXHit6EgEiQATmCQESv3ma7e5jnRLxS4icbLd1IH7CYKw/Dlm822W66JxKWUNY13sfdQmkyPaLf0L0JB33KgnZeLTbfCB9zlYkg3l7jYt+hTAoa7CLW7e+dYQA61gs+B2xK5aB9GEXED5CAqNP2hajVOKgI46lzcH3j9yV1LkdS1Rhd3k62WftdYij6WtMXaNLaRPRMcEueYkQPmq5VyGuVAqaYr9FkwKJTorxXVJlvWjafcSurBQrFY1tZ+4r2DB+KF2hpSXr3hHzJDb4QNC6L53Nh/MVbeEbemM27qBtKxR6atso+nV+gXvWX1bNx5Z0VCk6pQtC4hch6iKR+HVBi75EgAgQgflBgMRvfuZ6nJFO6VLPUcQvEkHLvuyCPPEXQmPrOCBjtS460fi6aIMtmK0gLVDabwktpSN3bocvkj6QJ6fzdt/OtUUM7Q5xkYfm4Eu7VsVCXhbzVg67efZx5koCoROiZ3Ui2/p6JYAgCJ4EYtkrRMLqcJTJn8/H2hypk4wceUVqhdx9HVljEJq6ltKD+5De7IeW0EZCIzVbdyU+2x0ut4iX7bjVIR2JZ+wy6mCI+oaAFeMUEGyTPJMYvSj5aQAYoU+ZadS9K+YTGdkplEPmTP1h8Y5iVh8XzQ/EtcOnN0dFJ2my1vLEoUn6y7vP6yF2YkhEZ3YKEr8AVieBxK8TXHQmAkSACMwNAiR+czPVYw10cYlfeh+gEkAhKuMRPyE/dthKgtIdPSF5NrYSveW274JddgCxKwhy4P0ggSnYD18UQMW6XmgBSluRB7bo5Zt2FwXEQEieZQbrlfgJ0bM2Kd1lofBDLHw4MlEmAkpYJD/Jx+UmY0Ddfzuyi7EpDm48MgYNUhiFdOs0yEPSwKc7RLIfOk7V56WEDvG9YIugyhs01EPv2rn1VTHYGtrDVOi3kEfBkkSxkd2X68tXHCKYJ+vq58mJmDP/LSbnWSB/imfSiw9uC0SxR7Fwus6fPkjndr4Bd/zGRa437Uj8ejMVTIQIEAEi0CsESPx6NR29S2aRLvX0O34F4md1jtXYEjKwwYrdfwtUkB1mjorBBbt1XufJjyNBuHcv7uSlu33Lk0s9oRc/JYI2lt7zp3FQomPfjevMfrrltlv8gxgoEYiXcnqCZ0nfeksC3M4fSlcXsiiE0LcFHfDkAp3ocl77DfkgF6tERnhqqZK/UFod2uTjQEyNBRmH9iEyxgCN+/Kl81C9NMo/JBcoY3Qn+Xqw+4bRzSlcFzEXi4EeSe/FZNWhTRn6jx2rlPaUdOtywVzY+NALobO1QACtHvMp/6R0Ps5fGrgY0t7FkVThYI+gCXWnH+/TBxmvsU1mId7jV5VMkmciOk+n4I5fFW6jdSR+ozGiBxEgAkRgHhEg8ZvHWW8/5t4TP+FgMh6/dBdy5wYIYqTkR2TwS0vyIC+HDYQIMkielVE6P2d3JErumLN2S2Osr/wDcbBy6bBrVSzghfRBAlGwFezaKfkLO33rLdkTWyzVR9sgVkr88v4kH8nJkVqkJOOTcWJs8TJWGRd8kTv+eTmPqXUsu4Xc+DFBL4RHHNyi3KZXfQRo0FM8RE4UiRidEqkQXvJwRuASDi9KkaiDHYLtqNBXqBTzi218Dzaei+sCu/nwOsydbZASQJm3MGeYO2dHa4eliytzqp250HFEaAR/tY9VTtaaxG8s0HvViMSvV9PBZIgAESACvUGAxK83U9HLRGaL+GGBD0IDKH2pxE9KvxuW7uo5Augu81QCmNpde4RLLpeU8MoeUOpi3S/2obHEAP8i6dPdPn+Zp7WDBAoR9ARQiZ+UaC1hUapsA/sjJX1K4sJYwzjdpaogg7BZtYzDihEnG09GYj98d670/Thi42yaDxwwtqZDZkECOy+tJ6rQHPmkh+ZRpXO9+r6BS+qkcq7M4sOtjvJpiHSEGLf2JBjYD7kc1zq7ucH8xLlG91Hv5USHPsQuAj5s3RUwFOuq71SGaJ1aBWfu+AUoZlUg8ZvVmWPeRIAIEIGFRYDEb2HxnfXoPSJ+fvXuWIvH1S7fw6LeCviyClH5Unf1Aimy+uVCjPxumN3Kkzp2/cSmJWK7XcH0Ekn4CG2Qvlwassz2a+2w4LcmR+TcvX0ggtjhc5d4WsKHHT/c9wfSJzYvC4FwD4MBBwDhkNITAj9wN06bC7KRsWGXD28glJzdzl8ksG7nc5nsaDrSo2RRQNOgSSlExw/M5eGMGF/bA32kh9SAm5shZ5J66pWQIKg9Bq7M/Cpy8SkXHSv6iA6SVchIxh2N6FZIGlQydqvQezfd3GB+QPow32KRDTNHDK3NGvAPdj03NBZi6xGH4rSxrh5dyjRyl3bel8RvDND61YTEr1/zwWyIABEgAn1BgMSvLzPRzzxmlvg50qGXczpy5Ha+rAziB6JnS+zy6T1+6Y6f6oRIgUyBZIVvT14cZxBygumTJb4s8LHIt0QOC34s/O0qXi7rlB0+t9MXyR4IIPyw+2d97Tfe6ReIgo0hX9ZHl/PgUzo+yHIxqpBZJXhp6caJ/JUEyzhAvxBHzrsghLG40WAc7sQMvSMPTcSZSp+IK5GTsHk99FtqnSpCr27sSb9ikbr9cF/SMHFJA4ns+vTqkFtBa42+zyQmWgjps6UQOo+BEjmnc8RPqJ+1u3mHv9UgFtr4OBpLdS4+PnG4EaDN+MdEjW0KvMdvfOz70ZLErx/zwCyIABEgAn1DgMSvbzPSr3yW8KmeclMdGI799jKwkbou1h15cZC5lbwjNXBLiRqIUHEXLCd5y5eDIIEEuh1B3N+nO4OIpcQPJdiS/Sodsty2H0oOtNTLOXWHL9RB9tY7oqfEEG3k2xNGJThKFrTjAnnzY0VuyBmXpbrcHdlzpE93A63d/gvj8AOBzh0Z8fGDQqHjKw08V3h8XERXEdkprLf2pmUewNV9Jp4KWZ1nQ5EUZbkmYSTXpA4xdJ/qq5RJ4xR/wcB2LiXmx/6TORayXpQxXzqXQvCkjiHYVvYbh8iai+/TF8FHzd1KjdKtVfAm8QtQzKpA4jerM8e8iQARIAILiwCJ38LiO+vRZ3rHT8mfEB+7wHcPPvGEzpM8IXvp7h92zmATAqXkzxIUS6aE84Fk2VlF7PzAel7ogCzu3W4Pdn5AAFKyp7t90CnhkxI7fd7f7fwhGg5PFlCRbpFPzAOpuDEq0fO7fJXj8G3R3rZDFDcS9yndySjQKw4ZlJOdwunElrYRheQnWm8K8dFZdLFScFBJzaGU7jxJgtLVnVlwFqVLKnETh5Cqcw+fMQuvKim83neGQmMraXM6T/SsMRB1O5+O7MW5RxvoEENKhLd+Gldn2A1OMUef8Bj3mKSt7ZPEb1zge9OOxK83U8FEiAARIAK9QoDEr1fT0btkZn7HD4QIJMlyICF+QpA8IQIRBMHT3T8pl9u61etloNIWMUAIQZIsURDSJYShyBoCMdBFvl2862WcSvb0kk5H+hzRCwSwkfgVz40C8UvHJmO1udpSxyWXtYoeudux2VAYj/uHSnEcoScQFqn4solPhBCI6jBC06hWvQQMHxhH3SHdJQTIiY5EoU1IxwrI0NW9NhhromfdptW0qfRpFRLfl5bBhSd6Yj5tVUidk62nJ++OBHriZ3VyfiBvEj8/KQnSieiMTsHXOdScvyPUJH4jAKKZCBABIjCnCJD4zenEtxz28IgfCJwnfLqzB4IkZA+kz8pK+hxJdP7gJ45s2TqYU6Q0AcoC8QNV8ARAd/Uc6XO7fG4HMMqjd/xCNyIo+RTyJmNyZM8RPquVMSFXfNsxCfGzepSgfHYM0jYhXpXkxxMvXZeDABUPRHFHSuJEZ2OjjF3YujPENmiqAVwY+ZRe7Ifrzfdpc/GSlD416xT1aFy3W6Zt8+7yuqYBf4lsBWlrP9yundX6uUVfgeDZB/YE2RO9vC4xLcHX3JUM6sCkn4YxaG7NpUZp9qq1csevFppZMZD4zcpMMU8iQASIwOIiQOK3uHjPWm//H+O2SS0PwgnMAAAAAElFTkSuQmCC" width="300"></p>	in-progress	high	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	1baee587-356c-421c-8df7-cd0c2ceefea7	2026-01-27 15:34:03.06	2026-01-27 18:37:38.605	\N	{}	task	\N	\N	\N	0	\N	\N	0
77ba1aca-003f-4aad-813d-ba70b1f51be7	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	need to make logo		done	medium	\N	\N	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	2026-02-03 13:35:52.298	2026-02-03 14:01:40.455	\N	{}	issue	ba44724c-4300-4993-bd22-c151c1e8527a	\N	\N	0	\N	\N	0
2b7ed755-71d1-4a95-ad5f-9bf7b287c57f	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	test	<p class="mb-2 leading-relaxed text-sm"><span style="white-space: pre-wrap;">test</span></p>	in-progress	medium	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	2026-02-03 14:26:47.212	2026-02-03 17:59:03.707	\N	{}	task	\N	\N	\N	0	\N	\N	0
\.


--
-- Data for Name: TaskComment; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."TaskComment" (id, "taskId", content, "userId", "createdAt", "updatedAt", "clientId", "parentId") FROM stdin;
caab883f-2b98-4c61-9a15-98e951dec07b	7993345e-0166-4a5b-949f-efba86bffee3	<p>partial done</p>	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	2026-01-27 18:00:04.386	2026-01-27 18:00:04.386	\N	\N
1da3fdf6-1a7c-41df-aa2d-d348a2e85fda	7993345e-0166-4a5b-949f-efba86bffee3	<p>ok @emp1</p>	1baee587-356c-421c-8df7-cd0c2ceefea7	2026-01-27 18:41:22.57	2026-01-27 18:41:22.57	\N	\N
452d33e9-1664-48ca-96e1-6d4a28fd2aa5	7993345e-0166-4a5b-949f-efba86bffee3	<p class="mb-2 leading-relaxed text-sm"><br></p>	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-30 14:03:33.775	2026-01-30 14:03:33.775	\N	\N
56f8e86b-9e1c-4a2d-a41b-4dd85e78d92d	7993345e-0166-4a5b-949f-efba86bffee3	<p class="mb-2 leading-relaxed text-sm"><span style="white-space: pre-wrap;">ok</span></p>	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-30 14:39:29.567	2026-01-30 14:39:29.567	\N	\N
36ec0eff-c6c2-4f79-86d4-18b977912ea0	77ba1aca-003f-4aad-813d-ba70b1f51be7	<p class="mb-2 leading-relaxed text-sm"><span style="white-space: pre-wrap;">done can you please check</span></p>	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	2026-02-03 13:39:12.394	2026-02-03 13:39:12.394	\N	\N
\.


--
-- Data for Name: TaskHistory; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."TaskHistory" (id, "taskId", "userId", "clientId", field, "oldValue", "newValue", "createdAt") FROM stdin;
3af4c53d-e1d0-4d27-a50f-a8dec3ebca34	77ba1aca-003f-4aad-813d-ba70b1f51be7	\N	ba44724c-4300-4993-bd22-c151c1e8527a	status	review	done	2026-02-03 13:41:44.26
f16cf00a-33db-43a6-a1d5-0e9ef7c4fbcd	77ba1aca-003f-4aad-813d-ba70b1f51be7	\N	ba44724c-4300-4993-bd22-c151c1e8527a	status	review	done	2026-02-03 14:01:40.463
\.


--
-- Data for Name: TaskLink; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."TaskLink" (id, "sourceId", "targetId", "relationType", "createdAt") FROM stdin;
\.


--
-- Data for Name: TaskWatcher; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."TaskWatcher" (id, "taskId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: TaxRate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."TaxRate" (id, "companyId", name, percentage, description, "isActive", "createdAt", "updatedAt") FROM stdin;
85ab4cbc-a390-4968-a282-5840b43fa62c	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	GST	18.00	Standard GST Rate	t	2026-01-30 15:00:54.687	2026-01-30 15:00:54.687
fd15d625-acd8-4fde-984d-960eb4055b24	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	IGST	18.00	Standard GST Rate	t	2026-01-30 15:00:59.28	2026-01-30 15:00:59.28
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Ticket" (id, "companyId", subject, description, category, priority, status, "createdAt", "updatedAt", "resolvedAt", "assignedToId", "clientContactId", "createdById") FROM stdin;
\.


--
-- Data for Name: TicketComment; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."TicketComment" (id, "ticketId", "userId", content, "createdAt") FROM stdin;
\.


--
-- Data for Name: TicketMessage; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."TicketMessage" (id, "ticketId", "senderId", content, "isInternal", "createdAt") FROM stdin;
\.


--
-- Data for Name: Timesheet; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Timesheet" (id, "companyId", "projectId", "employeeId", date, hours, "isBillable", description, "createdAt", "updatedAt", "endTime", "startTime", "taskId", "approvedAt", "approvedBy", "rejectionReason", status, "submittedAt") FROM stdin;
de6a7059-c022-4070-89a7-82d131dc0629	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	2026-02-03	0.01	t	Timer Session	2026-02-03 14:00:48.596	2026-02-03 14:00:48.596	2026-02-03 14:00:48.594	2026-02-03 14:00:19.639	77ba1aca-003f-4aad-813d-ba70b1f51be7	\N	\N	\N	draft	\N
e18a0f2c-1a65-4948-a2b5-5f8702c1ed1f	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	d19a9bd7-7edd-4fbf-90fc-5adb7be4205a	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	2026-02-03	0.01	t	Timer Session	2026-02-03 15:14:05.464	2026-02-03 15:14:05.464	2026-02-03 15:14:05.462	2026-02-03 15:13:35.947	2b7ed755-71d1-4a95-ad5f-9bf7b287c57f	\N	\N	\N	draft	\N
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Transaction" (id, "accountId", date, type, amount, description, reference, "createdAt") FROM stdin;
\.


--
-- Data for Name: UnitType; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."UnitType" (id, "companyId", name, symbol, "isActive", "createdAt", "updatedAt") FROM stdin;
a603d2b7-1214-401c-b31d-b7f2a8be464a	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Service	srv	t	2026-01-30 14:45:55.944	2026-01-30 14:45:55.944
377d0a65-c5c4-47a8-9702-ce3068dcfa79	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Month	mo	t	2026-02-09 11:46:08.526	2026-02-09 11:46:08.526
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."User" (id, email, password, "firstName", "lastName", phone, "isActive", "lastLogin", "createdAt", "updatedAt", "resetToken", "resetTokenExpiry", "companyId") FROM stdin;
1baee587-356c-421c-8df7-cd0c2ceefea7	sapplizor@gmail.com	$2a$10$xun5T0A86yEjNw1SGiKp4eWbMWbdn19Qrd6wKWHTzrXBjU4CfurXG	sapplizor	sapplizor		t	2026-01-30 08:03:55.629	2026-01-27 14:22:53.699	2026-01-30 08:03:55.63	\N	\N	b81a0e3f-9301-43f7-a633-6db7e5fa54b0
c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	applizor1@gmail.com	$2a$10$Brdn50k.Xb1niec3Rv18OuyUYj6N9hzvlbCmQ8egD09VqjURs4r86	emp1	EMP		t	2026-02-03 18:37:19.428	2026-01-26 12:40:38.713	2026-02-03 18:37:19.43	\N	\N	b81a0e3f-9301-43f7-a633-6db7e5fa54b0
b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	admin@applizor.com	$2a$10$DpWhIvmPTMQL0LOm7NOmF.OXI2rlSSQHtgaXN6AYgP8pJ8MCXCucK	Admin	User	\N	t	2026-02-05 16:33:23.656	2026-01-23 04:26:48.968	2026-02-05 16:33:23.657	\N	\N	b81a0e3f-9301-43f7-a633-6db7e5fa54b0
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."UserRole" (id, "userId", "roleId", "createdAt") FROM stdin;
6885b1cd-53be-49a8-a807-0a1090128892	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.977
e3e648d7-5a08-4bc8-9afb-c1d842c1db4b	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 12:40:38.723
1611195a-f411-455f-b2f0-475c70b2142d	1baee587-356c-421c-8df7-cd0c2ceefea7	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-27 14:22:53.704
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
fe5ea750-cad0-4dc6-b619-331488916f9c	628e861940c69e0e690acaccd985ecb6240e75eee971bfd0f24e3e561b09c6dd	2026-01-23 04:26:42.812394+00	20260118190927_add_leave_balances	\N	\N	2026-01-23 04:26:42.145524+00	1
8bba931a-2345-4581-89ea-01646ba404dd	798311312f113476b21e051b6f265b0bdc699e6ac65fdfd3c711c48180ea641d	2026-01-23 04:26:42.908171+00	20260119153533_add_advanced_leave_features	\N	\N	2026-01-23 04:26:42.814385+00	1
1c42ae14-bbcc-434c-bf1f-6e2dece31a34	ec949b307de76a7cbc7fdc5435e79a0420c70d812e7143e1d587c595357cf0c5	2026-01-23 04:26:42.922682+00	20260119193527_add_lop_days_to_leave_request	\N	\N	2026-01-23 04:26:42.910401+00	1
e6565d3d-2427-4540-b466-6bf6a3f2c51b	c41e222fc7d8504efd0b7d60aeabe1b4c1dcfc9436ec304ea04d2f7f1b96cc39	2026-01-23 04:26:42.933047+00	20260119201239_add_quarterly_probation_fields	\N	\N	2026-01-23 04:26:42.925105+00	1
05d51d8a-47f7-4f18-ace2-efc3dcd6ba9a	c4fe7e18cd757ff12c2add94ecc066b7ea4de13a005919f180df132b875c2dd1	2026-01-23 04:26:43.084808+00	20260121095900_add_quotation_templates	\N	\N	2026-01-23 04:26:42.935472+00	1
10f11805-1648-4e7c-aab0-f767d2c32e35	9046c3d89ceeda5bd6cdc4cfa82b0fc5e653012c79d3d4e2f5e49ce50e51f003	2026-01-23 04:26:43.109255+00	20260121103803_add_quotation_analytics	\N	\N	2026-01-23 04:26:43.086523+00	1
5538f3f7-818b-49b2-a318-acf999104913	84ee5b15cfc0cc62f3b59fe11f79ea83e4994919986eb84ff09f766d6882ea18	2026-01-23 04:26:43.118726+00	20260121104742_add_quotation_reminders	\N	\N	2026-01-23 04:26:43.111228+00	1
4b724f9e-ca6d-4c6d-aabf-a27cfad9a934	b803ac9df5a0bf416727f5cb03e9fab71aec806bd3e7ca6760cf79fbfef75887	2026-01-23 04:26:43.12714+00	20260121120659_add_probation_processed	\N	\N	2026-01-23 04:26:43.120806+00	1
eccc7271-ebb3-4449-9228-33f604f30899	2fc2494f24931231824e8fa1f4e0288084c19440cb0e00648dfc55b6213be723	2026-01-23 04:26:45.958225+00	20260123042645_add_pdf_margins	\N	\N	2026-01-23 04:26:45.869442+00	1
4208c5fa-cd2e-4382-9dc2-ad7b3205b2f8	a2be4b626e745742ec8cf29145dd9c2cd6e6846d35d80270807bbd6a2861e6fa	2026-01-26 08:44:59.335635+00	20260126084459_add_contract_fields	\N	\N	2026-01-26 08:44:59.318815+00	1
62a186ab-49f9-4f1e-8ea7-a4271b435a72	bf50a5065fcbcaac01945915cc6f4e89091fc1037fd1a8e714643c262053da0f	2026-01-26 10:37:09.75003+00	20260126103709_add_client_enhanced_fields	\N	\N	2026-01-26 10:37:09.719997+00	1
ccd3d876-c412-4995-815d-9f7abdfa2c0e	5e201308c175d290e53dedb3f48e3f73b250da80943428e496725f2fa32d4265	2026-01-26 10:42:18.609144+00	20260126104218_add_client_comprehensive_details	\N	\N	2026-01-26 10:42:18.552486+00	1
5fbd5d5f-66f4-40d1-8047-fc96694786f0	998bfec3f415ad317d8e2aa3932a3fff9e75c52a5211e32a27d294575fb2269b	2026-01-26 10:52:52.341413+00	20260126105252_add_client_company_name_v2	\N	\N	2026-01-26 10:52:52.332549+00	1
4846b9ee-b997-426e-9b0d-9eaccf66b2a3	17b781ec13486dc2b1f28fb221d4ade445bf5301206ba6161fae01b0776af8a3	2026-02-01 09:21:23.120618+00	20260129143853_add_multi_tax_support		\N	2026-02-01 09:21:23.120618+00	0
1b73d0ff-2dc4-42e8-9810-3b13c734fcd0	b7ce3fe268e752f45f9f1f535a9018f21c8db6ecb20a9a5f15d5a6859922f8d1	2026-02-01 09:21:24.974936+00	20260130060941_add_document_workflow		\N	2026-02-01 09:21:24.974936+00	0
a457f8d0-31b8-4e63-84b6-350da92888d6	234a85e313d65d18eff113f10e4ecd4f1e9dc6be532804fd5ef4c8d6f3ed317b	2026-02-01 09:21:26.639594+00	20260130061612_add_uploader_to_document		\N	2026-02-01 09:21:26.639594+00	0
ff55cc73-fc7d-4b58-9d29-a1971d50a9de	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2026-02-01 09:21:29.01716+00	20260130062247_final_sync		\N	2026-02-01 09:21:29.01716+00	0
4b0cae86-80c8-4fc2-b5ec-68560897aafc	61a6a642e12f0a712b00677a5c709fc6bbbb1531788e89056ad21064955654e7	2026-02-01 09:21:30.973229+00	20260201090728_add_invoice_item_discount	\N	\N	2026-02-01 09:21:30.959453+00	1
8c83013e-4dfe-4e60-91b8-70f21fb9e22d	0b68e0a1ffe80c06ac27f5bd27b5cb895f7ba40f1bd44541726f1f7ac8dc18af	2026-02-03 13:25:38.181288+00	20260203125444_add_milestone_review_status		\N	2026-02-03 13:25:38.181288+00	0
e8b62f8e-77cc-4fbb-ad2e-336a367f28e5	5134c844b0545d2d8528d9325d8b8984dd9e234e967cca651d1d2e2c3c9ba53b	2026-02-03 14:33:14.350071+00	20260203143314_add_timer_pause_resume_support_fixed	\N	\N	2026-02-03 14:33:14.3359+00	1
1040d754-4065-418e-93c4-b32cd7edfe30	2899fa8a5aa386544f7fb707580c5d02c9345b3b7f401d0896ac16b70fe6d2cc	2026-02-03 15:56:35.866054+00	20260203155635_add_statutory_config	\N	\N	2026-02-03 15:56:35.83018+00	1
98ec2dfa-558f-43f2-b2de-21032ba7c05a	ad84cd02e08243e555686bed10c2d4c1797cf860cd708d13bd90b8991b821e20	2026-02-03 17:23:50.615532+00	20260203172350_add_candidate_link	\N	\N	2026-02-03 17:23:50.604623+00	1
7e5aa16b-dd66-41a6-8e3f-eb0cbb9f34a7	c4b1fbc7de06f75eaf19ad417dbbdc49203a88d203e00d45bf628bd74258dae5	2026-02-05 14:00:32.191385+00	20260205140032_add_timesheet_approvals	\N	\N	2026-02-05 14:00:32.174836+00	1
68e3e025-e5a0-4fba-9c8f-71923ce50cf4	cc9ed48e333a86cccb57045d8d7ecde5fd1e5a57c5b7bf9d86cf9879421b15c5	2026-02-05 14:22:20.183611+00	20260205140956_unify_helpdesk_ticket_model	\N	\N	2026-02-05 14:22:20.070858+00	1
e25259ed-ee26-42c9-a688-524dffdde5a3	ef2f5302411497dc1111d877d49ea671c3f2815b7f0aa9a65219990963c78e75	2026-02-05 14:27:05.680882+00	20260205142705_add_project_permissions	\N	\N	2026-02-05 14:27:05.664479+00	1
208e7b5a-4a8b-427e-87dc-7cf044a60ad3	d3f83ecf64f1a1f60c4f55b66ce47dcb2dea6507b330ed0e49fd603c84a09bec	2026-02-05 16:28:44.036645+00	20260205162844_add_template_id_to_offer_letter	\N	\N	2026-02-05 16:28:44.02532+00	1
78e4761f-4fcc-462f-ab00-d06e9ab64d01	f4d5fca75e6c49b254f666d6258cf5951bef46ce7c1e1b77573d3ba005b88946	2026-02-05 14:35:41.139461+00	20260205143541_optimize_indexes	\N	\N	2026-02-05 14:35:41.105946+00	1
eec5d027-2af5-45e8-8e34-38cb679f158e	da03957237a0028e6df4179cc9455c801d3113470834dead0024d5791bf8bc64	2026-02-05 15:53:41.611877+00	20260205155341_add_meeting_link	\N	\N	2026-02-05 15:53:41.601525+00	1
7b7cf3a5-db96-43fe-a8a8-2cb5a5e10ec3	6cc2bd56e43e31643be0efbd73e23a18a75473242eea329b9cab30b1d841ab54	2026-02-05 16:14:14.030112+00	20260205161414_add_scorecard_recommendation	\N	\N	2026-02-05 16:14:14.018931+00	1
8fc36140-74ac-4603-89e8-1f863c4d410c	79fbf77861837d5ded490470a3590968624e552854d6411cd6fe79759c9b8e9f	2026-02-09 10:54:30.746958+00	20260209105430_add_company_bank_details	\N	\N	2026-02-09 10:54:30.719723+00	1
07a40316-0c11-4374-ade6-cf4334c12cf1	e486926f86ce5735f35fa7e7e4fe6b4fa21c5d7a88ea5abcb934de88dfa6f174	2026-02-09 11:31:25.298898+00	20260209113125_add_tan_to_client	\N	\N	2026-02-09 11:31:25.284455+00	1
\.


--
-- Data for Name: active_timers; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public.active_timers (id, "companyId", "employeeId", "projectId", "taskId", "startTime", "accumulatedTime", "isPaused") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public.notifications (id, "companyId", "userId", title, message, type, "isRead", link, "createdAt") FROM stdin;
e2c4cee2-9594-4fa6-b5da-9cf5c989eee2	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	Task Update	Update in need to make logo	info	f	/projects/d19a9bd7-7edd-4fbf-90fc-5adb7be4205a/tasks?taskId=77ba1aca-003f-4aad-813d-ba70b1f51be7	2026-02-03 13:37:09.359
331ed9cd-6c3e-48a7-bf48-ff420a319635	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	Task Update	Update in test	info	f	/projects/d19a9bd7-7edd-4fbf-90fc-5adb7be4205a/tasks?taskId=2b7ed755-71d1-4a95-ad5f-9bf7b287c57f	2026-02-03 14:27:09.953
\.


--
-- Data for Name: quotation_templates; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public.quotation_templates (id, "companyId", name, description, category, title, "templateDescription", "paymentTerms", "deliveryTerms", notes, items, "isActive", "usageCount", "createdBy", "createdAt", "updatedAt") FROM stdin;
44abfa8c-0c9f-4a97-bf23-aa18e055bd7e	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	News website and video streaming app quotation	\N	News Website and Streaming App	News website and video streaming app quotation	<p>Applizor Softech LLP is pleased to present this proposal for developing a fully functional, self-hosted video news platform for Peptech Time. This platform will include a feature-rich website and mobile apps for Android, iOS, and Android TV.</p><p>Our focus is to deliver a seamless experience where users can read news articles and stream news videos — with complete control over content and monetization.</p><h4><strong>Project Timeline</strong></h4><p>Website Development 4–5 Weeks</p><p>Android &amp; iOS App 2–3 Weeks</p><p>Android TV App 1–2 Weeks</p><p><br></p><p><strong>Website Development (React.js + Spring Boot)</strong></p><p>Infrastructure Setup</p><p>VPS/Cloud hosting setup (DigitalOcean/Linode)</p><p>CDN configuration (Cloudflare)</p><p>Media storage integration (Amazon S3 or Wasabi)</p><p>Platform Setup</p><p>React.js frontend with SEO support</p><p>Spring Boot backend with REST APIs</p><p>Admin dashboard for managing reporters, news, and media</p><p>News &amp; Video Content</p><p>Post multilingual news articles (Hindi, English, Hinglish)</p><p>Upload self-hosted videos via admin panel</p><p>Use custom HLS video player (Video.js or Shaka Player)</p><p>Live streaming setup using RTMP + HLS</p><p>Reporter System</p><p>Create reporter login system</p><p>Reporters can post text + video-based news</p><p>Approval system by admin before publish</p><p>User Engagement &amp; Monetization</p><p>Push notification integration</p><p>Social sharing (WhatsApp, Telegram)</p><p>Donation support via Razorpay/Instamojo</p><p>Video ads (VAST tag support)</p><p>Option to add affiliate links and banners</p><p>Security &amp; Performance</p><p>JWT authentication</p><p>SSL certificate, secure API practices</p><p>Caching, image compression, lazy loading</p><p>Regular backups and system monitoring</p><p><br></p><p><strong>Mobile App Development (React Native)</strong></p><p>for Android, iOS &amp; Android TV – single codebase using React Native)</p><p>Platforms</p><p>Android Phone/Tablet App iOS App</p><p>Android TV App (custom layout and controls)</p><p>Core Features</p><p>Stream videos using HLS format</p><p>News article viewer with multilingual support</p><p>Push notifications for breaking news</p><p>User login and donation integration</p><p>Offline download support (optional)</p><p>Chromecast &amp; Android TV playback support</p><p>Security &amp; Optimization</p><p>Encrypted API communication</p><p>Optimized UI/UX for speed and responsiveness</p><p>Play Store &amp; App Store compliance</p><p>Scalability</p><p>Support for future features like:</p><p>AI-based subtitles</p><p>Scheduled publishing</p><p>Personalized content suggestions</p>	<p>Payment due within 30 days. 50% Advance to start work.</p>	<p>Delivery via Email/Cloud Link.</p>	<p>This quotation is valid for 15 days.</p>	[{"tax": 18, "discount": 0, "quantity": 1, "unitPrice": 60000, "description": "Website Development (React.js + Spring Boot)"}, {"tax": 18, "discount": 0, "quantity": 1, "unitPrice": 60000, "description": "Mobile App Development (React Native)"}]	t	2	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-23 04:42:23.824	2026-01-26 07:33:28.821
7ba94a08-873a-4507-852d-bf99618908bf	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Diagnostic Booking & Report Management System	\N		Diagnostic Booking & Report Management System	<h4><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Admin Panel</strong></b></h4><ul class="list-disc ml-5 mb-4 space-y-1"><li value="1" class="pl-1"><span style="white-space: pre-wrap;">Add and manage diagnostic tests</span></li><li value="2" class="pl-1"><span style="white-space: pre-wrap;">Create and manage test profiles (packages)</span></li><li value="3" class="pl-1"><span style="white-space: pre-wrap;">Add and manage diagnostic centers</span></li><li value="4" class="pl-1"><span style="white-space: pre-wrap;">Set center location (city / area)</span></li><li value="5" class="pl-1"><span style="white-space: pre-wrap;">Configure payment gateway details for each center</span></li><li value="6" class="pl-1"><span style="white-space: pre-wrap;">View patients and all bookings</span></li><li value="7" class="pl-1"><span style="white-space: pre-wrap;">Upload test reports in PDF format against bookings</span></li></ul><h4><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Patient Portal</strong></b></h4><ul class="list-disc ml-5 mb-4 space-y-1"><li value="1" class="pl-1"><span style="white-space: pre-wrap;">Location selection (city / area)</span></li><li value="2" class="pl-1"><span style="white-space: pre-wrap;">View nearest available diagnostic centers</span></li><li value="3" class="pl-1"><span style="white-space: pre-wrap;">Option to select </span><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Home Collection</strong></b><span style="white-space: pre-wrap;"> if no nearby center is available</span></li><li value="4" class="pl-1"><span style="white-space: pre-wrap;">Select tests or test profiles</span></li><li value="5" class="pl-1"><span style="white-space: pre-wrap;">Online payment integration</span></li><li value="6" class="pl-1"><span style="white-space: pre-wrap;">Booking visibility in admin panel</span></li><li value="7" class="pl-1"><span style="white-space: pre-wrap;">Simple login using </span><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">email and mobile number only</strong></b></li><li value="8" class="pl-1"><span style="white-space: pre-wrap;">View and download uploaded test reports (PDF) after login</span></li></ul><h4><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Design &amp; User Experience</strong></b></h4><ul class="list-disc ml-5 mb-4 space-y-1"><li value="1" class="pl-1"><span style="white-space: pre-wrap;">Clean and functional UI</span></li><li value="2" class="pl-1"><span style="white-space: pre-wrap;">Primary focus on </span><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">seamless, fast, and reliable booking flow</strong></b></li></ul><h3 class="text-lg font-bold text-slate-800 mb-2 mt-4"><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">Timeline</strong></b></h3><ul class="list-disc ml-5 mb-4 space-y-1"><li value="1" class="pl-1"><b><strong class="font-bold text-slate-900" style="white-space: pre-wrap;">45 days</strong></b><span style="white-space: pre-wrap;"> from project start date</span></li></ul>	50% Advance to start work.	Delivery via Email/Cloud Link.	This quotation is valid for 1 days.	[{"unit": "srv", "discount": 0, "quantity": 1, "unitPrice": 100000, "hsnSacCode": "998314", "taxRateIds": ["85ab4cbc-a390-4968-a282-5840b43fa62c"], "description": "Software Development Services"}]	t	15	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-30 14:50:52.849	2026-02-01 15:29:56.085
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: AutomationRule AutomationRule_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."AutomationRule"
    ADD CONSTRAINT "AutomationRule_pkey" PRIMARY KEY (id);


--
-- Name: Branch Branch_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_pkey" PRIMARY KEY (id);


--
-- Name: Candidate Candidate_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT "Candidate_pkey" PRIMARY KEY (id);


--
-- Name: ClientCategory ClientCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ClientCategory"
    ADD CONSTRAINT "ClientCategory_pkey" PRIMARY KEY (id);


--
-- Name: ClientSubCategory ClientSubCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ClientSubCategory"
    ADD CONSTRAINT "ClientSubCategory_pkey" PRIMARY KEY (id);


--
-- Name: Client Client_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: ContractActivity ContractActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ContractActivity"
    ADD CONSTRAINT "ContractActivity_pkey" PRIMARY KEY (id);


--
-- Name: ContractTemplate ContractTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ContractTemplate"
    ADD CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Contract Contract_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: DocumentTemplate DocumentTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."DocumentTemplate"
    ADD CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: EmailTemplate EmailTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmailTemplate"
    ADD CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeLeaveBalance EmployeeLeaveBalance_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeLeaveBalance"
    ADD CONSTRAINT "EmployeeLeaveBalance_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeSalaryComponent EmployeeSalaryComponent_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeSalaryComponent"
    ADD CONSTRAINT "EmployeeSalaryComponent_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeSalaryStructure EmployeeSalaryStructure_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeSalaryStructure"
    ADD CONSTRAINT "EmployeeSalaryStructure_pkey" PRIMARY KEY (id);


--
-- Name: Employee Employee_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY (id);


--
-- Name: Estimate Estimate_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Estimate"
    ADD CONSTRAINT "Estimate_pkey" PRIMARY KEY (id);


--
-- Name: Holiday Holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Holiday"
    ADD CONSTRAINT "Holiday_pkey" PRIMARY KEY (id);


--
-- Name: InterviewScorecard InterviewScorecard_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InterviewScorecard"
    ADD CONSTRAINT "InterviewScorecard_pkey" PRIMARY KEY (id);


--
-- Name: Interview Interview_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Interview"
    ADD CONSTRAINT "Interview_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceActivity InvoiceActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InvoiceActivity"
    ADD CONSTRAINT "InvoiceActivity_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceItemTax InvoiceItemTax_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InvoiceItemTax"
    ADD CONSTRAINT "InvoiceItemTax_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceItem InvoiceItem_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: JobOpening JobOpening_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JobOpening"
    ADD CONSTRAINT "JobOpening_pkey" PRIMARY KEY (id);


--
-- Name: JournalEntryLine JournalEntryLine_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JournalEntryLine"
    ADD CONSTRAINT "JournalEntryLine_pkey" PRIMARY KEY (id);


--
-- Name: JournalEntry JournalEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_pkey" PRIMARY KEY (id);


--
-- Name: LeadActivity LeadActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeadActivity"
    ADD CONSTRAINT "LeadActivity_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: LeaveAccrual LeaveAccrual_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveAccrual"
    ADD CONSTRAINT "LeaveAccrual_pkey" PRIMARY KEY (id);


--
-- Name: LeaveRequest LeaveRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY (id);


--
-- Name: LeaveType LeaveType_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveType"
    ADD CONSTRAINT "LeaveType_pkey" PRIMARY KEY (id);


--
-- Name: LedgerAccount LedgerAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LedgerAccount"
    ADD CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY (id);


--
-- Name: Milestone Milestone_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Milestone"
    ADD CONSTRAINT "Milestone_pkey" PRIMARY KEY (id);


--
-- Name: OfferLetter OfferLetter_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."OfferLetter"
    ADD CONSTRAINT "OfferLetter_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Payroll Payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Payroll"
    ADD CONSTRAINT "Payroll_pkey" PRIMARY KEY (id);


--
-- Name: Policy Policy_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Policy"
    ADD CONSTRAINT "Policy_pkey" PRIMARY KEY (id);


--
-- Name: Position Position_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_pkey" PRIMARY KEY (id);


--
-- Name: ProjectMember ProjectMember_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ProjectMember"
    ADD CONSTRAINT "ProjectMember_pkey" PRIMARY KEY (id);


--
-- Name: ProjectNote ProjectNote_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ProjectNote"
    ADD CONSTRAINT "ProjectNote_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: QuotationActivity QuotationActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationActivity"
    ADD CONSTRAINT "QuotationActivity_pkey" PRIMARY KEY (id);


--
-- Name: QuotationItemTax QuotationItemTax_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationItemTax"
    ADD CONSTRAINT "QuotationItemTax_pkey" PRIMARY KEY (id);


--
-- Name: QuotationItem QuotationItem_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_pkey" PRIMARY KEY (id);


--
-- Name: Quotation Quotation_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SalaryComponent SalaryComponent_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."SalaryComponent"
    ADD CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY (id);


--
-- Name: SalesTarget SalesTarget_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."SalesTarget"
    ADD CONSTRAINT "SalesTarget_pkey" PRIMARY KEY (id);


--
-- Name: ShiftRoster ShiftRoster_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ShiftRoster"
    ADD CONSTRAINT "ShiftRoster_pkey" PRIMARY KEY (id);


--
-- Name: Shift Shift_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Shift"
    ADD CONSTRAINT "Shift_pkey" PRIMARY KEY (id);


--
-- Name: Sprint Sprint_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Sprint"
    ADD CONSTRAINT "Sprint_pkey" PRIMARY KEY (id);


--
-- Name: StatutoryConfig StatutoryConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."StatutoryConfig"
    ADD CONSTRAINT "StatutoryConfig_pkey" PRIMARY KEY (id);


--
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- Name: TaskComment TaskComment_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskComment"
    ADD CONSTRAINT "TaskComment_pkey" PRIMARY KEY (id);


--
-- Name: TaskHistory TaskHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskHistory"
    ADD CONSTRAINT "TaskHistory_pkey" PRIMARY KEY (id);


--
-- Name: TaskLink TaskLink_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskLink"
    ADD CONSTRAINT "TaskLink_pkey" PRIMARY KEY (id);


--
-- Name: TaskWatcher TaskWatcher_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskWatcher"
    ADD CONSTRAINT "TaskWatcher_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


--
-- Name: TaxRate TaxRate_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaxRate"
    ADD CONSTRAINT "TaxRate_pkey" PRIMARY KEY (id);


--
-- Name: TicketComment TicketComment_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TicketComment"
    ADD CONSTRAINT "TicketComment_pkey" PRIMARY KEY (id);


--
-- Name: TicketMessage TicketMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: Timesheet Timesheet_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Timesheet"
    ADD CONSTRAINT "Timesheet_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: UnitType UnitType_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."UnitType"
    ADD CONSTRAINT "UnitType_pkey" PRIMARY KEY (id);


--
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: active_timers active_timers_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public.active_timers
    ADD CONSTRAINT active_timers_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: quotation_templates quotation_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT quotation_templates_pkey PRIMARY KEY (id);


--
-- Name: Account_code_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Account_code_idx" ON public."Account" USING btree (code);


--
-- Name: Account_code_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Account_code_key" ON public."Account" USING btree (code);


--
-- Name: Account_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Account_type_idx" ON public."Account" USING btree (type);


--
-- Name: Asset_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Asset_companyId_idx" ON public."Asset" USING btree ("companyId");


--
-- Name: Asset_companyId_serialNumber_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Asset_companyId_serialNumber_key" ON public."Asset" USING btree ("companyId", "serialNumber");


--
-- Name: Asset_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Asset_employeeId_idx" ON public."Asset" USING btree ("employeeId");


--
-- Name: Attendance_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Attendance_date_idx" ON public."Attendance" USING btree (date);


--
-- Name: Attendance_employeeId_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Attendance_employeeId_date_idx" ON public."Attendance" USING btree ("employeeId", date);


--
-- Name: Attendance_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Attendance_employeeId_idx" ON public."Attendance" USING btree ("employeeId");


--
-- Name: AuditLog_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "AuditLog_companyId_idx" ON public."AuditLog" USING btree ("companyId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "AuditLog_entityType_entityId_idx" ON public."AuditLog" USING btree ("entityType", "entityId");


--
-- Name: AuditLog_module_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "AuditLog_module_idx" ON public."AuditLog" USING btree (module);


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: AutomationRule_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "AutomationRule_projectId_idx" ON public."AutomationRule" USING btree ("projectId");


--
-- Name: Branch_companyId_code_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Branch_companyId_code_key" ON public."Branch" USING btree ("companyId", code);


--
-- Name: Branch_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Branch_companyId_idx" ON public."Branch" USING btree ("companyId");


--
-- Name: Candidate_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Candidate_companyId_idx" ON public."Candidate" USING btree ("companyId");


--
-- Name: Candidate_email_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Candidate_email_idx" ON public."Candidate" USING btree (email);


--
-- Name: Candidate_jobOpeningId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Candidate_jobOpeningId_idx" ON public."Candidate" USING btree ("jobOpeningId");


--
-- Name: Candidate_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Candidate_status_idx" ON public."Candidate" USING btree (status);


--
-- Name: ClientCategory_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ClientCategory_companyId_idx" ON public."ClientCategory" USING btree ("companyId");


--
-- Name: ClientSubCategory_categoryId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ClientSubCategory_categoryId_idx" ON public."ClientSubCategory" USING btree ("categoryId");


--
-- Name: Client_categoryId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Client_categoryId_idx" ON public."Client" USING btree ("categoryId");


--
-- Name: Client_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Client_companyId_idx" ON public."Client" USING btree ("companyId");


--
-- Name: Client_email_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Client_email_idx" ON public."Client" USING btree (email);


--
-- Name: Client_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Client_status_idx" ON public."Client" USING btree (status);


--
-- Name: Company_name_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Company_name_idx" ON public."Company" USING btree (name);


--
-- Name: ContractActivity_contractId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ContractActivity_contractId_idx" ON public."ContractActivity" USING btree ("contractId");


--
-- Name: ContractActivity_createdAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ContractActivity_createdAt_idx" ON public."ContractActivity" USING btree ("createdAt");


--
-- Name: ContractActivity_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ContractActivity_type_idx" ON public."ContractActivity" USING btree (type);


--
-- Name: ContractTemplate_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ContractTemplate_companyId_idx" ON public."ContractTemplate" USING btree ("companyId");


--
-- Name: Contract_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Contract_clientId_idx" ON public."Contract" USING btree ("clientId");


--
-- Name: Contract_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Contract_companyId_idx" ON public."Contract" USING btree ("companyId");


--
-- Name: Contract_creatorId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Contract_creatorId_idx" ON public."Contract" USING btree ("creatorId");


--
-- Name: Contract_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Contract_projectId_idx" ON public."Contract" USING btree ("projectId");


--
-- Name: Contract_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Contract_status_idx" ON public."Contract" USING btree (status);


--
-- Name: Department_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Department_companyId_idx" ON public."Department" USING btree ("companyId");


--
-- Name: Department_companyId_name_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Department_companyId_name_key" ON public."Department" USING btree ("companyId", name);


--
-- Name: DocumentTemplate_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "DocumentTemplate_companyId_idx" ON public."DocumentTemplate" USING btree ("companyId");


--
-- Name: Document_category_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_category_idx" ON public."Document" USING btree (category);


--
-- Name: Document_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_clientId_idx" ON public."Document" USING btree ("clientId");


--
-- Name: Document_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_companyId_idx" ON public."Document" USING btree ("companyId");


--
-- Name: Document_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_employeeId_idx" ON public."Document" USING btree ("employeeId");


--
-- Name: Document_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_projectId_idx" ON public."Document" USING btree ("projectId");


--
-- Name: Document_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Document_type_idx" ON public."Document" USING btree (type);


--
-- Name: EmailTemplate_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "EmailTemplate_companyId_idx" ON public."EmailTemplate" USING btree ("companyId");


--
-- Name: EmailTemplate_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "EmailTemplate_type_idx" ON public."EmailTemplate" USING btree (type);


--
-- Name: EmployeeLeaveBalance_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "EmployeeLeaveBalance_employeeId_idx" ON public."EmployeeLeaveBalance" USING btree ("employeeId");


--
-- Name: EmployeeLeaveBalance_employeeId_leaveTypeId_year_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "EmployeeLeaveBalance_employeeId_leaveTypeId_year_key" ON public."EmployeeLeaveBalance" USING btree ("employeeId", "leaveTypeId", year);


--
-- Name: EmployeeSalaryComponent_structureId_componentId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "EmployeeSalaryComponent_structureId_componentId_key" ON public."EmployeeSalaryComponent" USING btree ("structureId", "componentId");


--
-- Name: EmployeeSalaryStructure_employeeId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "EmployeeSalaryStructure_employeeId_key" ON public."EmployeeSalaryStructure" USING btree ("employeeId");


--
-- Name: Employee_companyId_employeeId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Employee_companyId_employeeId_key" ON public."Employee" USING btree ("companyId", "employeeId");


--
-- Name: Employee_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Employee_companyId_idx" ON public."Employee" USING btree ("companyId");


--
-- Name: Employee_email_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Employee_email_idx" ON public."Employee" USING btree (email);


--
-- Name: Employee_email_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Employee_email_key" ON public."Employee" USING btree (email);


--
-- Name: Employee_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Employee_status_idx" ON public."Employee" USING btree (status);


--
-- Name: Employee_userId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Employee_userId_key" ON public."Employee" USING btree ("userId");


--
-- Name: Estimate_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Estimate_companyId_idx" ON public."Estimate" USING btree ("companyId");


--
-- Name: Estimate_leadId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Estimate_leadId_idx" ON public."Estimate" USING btree ("leadId");


--
-- Name: Holiday_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Holiday_date_idx" ON public."Holiday" USING btree (date);


--
-- Name: Holiday_date_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Holiday_date_key" ON public."Holiday" USING btree (date);


--
-- Name: InterviewScorecard_interviewId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "InterviewScorecard_interviewId_key" ON public."InterviewScorecard" USING btree ("interviewId");


--
-- Name: Interview_candidateId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Interview_candidateId_idx" ON public."Interview" USING btree ("candidateId");


--
-- Name: Interview_scheduledAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Interview_scheduledAt_idx" ON public."Interview" USING btree ("scheduledAt");


--
-- Name: InvoiceActivity_createdAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "InvoiceActivity_createdAt_idx" ON public."InvoiceActivity" USING btree ("createdAt");


--
-- Name: InvoiceActivity_invoiceId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "InvoiceActivity_invoiceId_idx" ON public."InvoiceActivity" USING btree ("invoiceId");


--
-- Name: InvoiceActivity_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "InvoiceActivity_type_idx" ON public."InvoiceActivity" USING btree (type);


--
-- Name: InvoiceItemTax_invoiceItemId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "InvoiceItemTax_invoiceItemId_idx" ON public."InvoiceItemTax" USING btree ("invoiceItemId");


--
-- Name: InvoiceItemTax_taxRateId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "InvoiceItemTax_taxRateId_idx" ON public."InvoiceItemTax" USING btree ("taxRateId");


--
-- Name: InvoiceItem_invoiceId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "InvoiceItem_invoiceId_idx" ON public."InvoiceItem" USING btree ("invoiceId");


--
-- Name: InvoiceItem_taxRateId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "InvoiceItem_taxRateId_idx" ON public."InvoiceItem" USING btree ("taxRateId");


--
-- Name: Invoice_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_clientId_idx" ON public."Invoice" USING btree ("clientId");


--
-- Name: Invoice_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_companyId_idx" ON public."Invoice" USING btree ("companyId");


--
-- Name: Invoice_companyId_invoiceNumber_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Invoice_companyId_invoiceNumber_key" ON public."Invoice" USING btree ("companyId", "invoiceNumber");


--
-- Name: Invoice_invoiceDate_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_invoiceDate_idx" ON public."Invoice" USING btree ("invoiceDate");


--
-- Name: Invoice_invoiceNumber_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_invoiceNumber_idx" ON public."Invoice" USING btree ("invoiceNumber");


--
-- Name: Invoice_invoiceNumber_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON public."Invoice" USING btree ("invoiceNumber");


--
-- Name: Invoice_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_projectId_idx" ON public."Invoice" USING btree ("projectId");


--
-- Name: Invoice_publicToken_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Invoice_publicToken_key" ON public."Invoice" USING btree ("publicToken");


--
-- Name: Invoice_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_status_idx" ON public."Invoice" USING btree (status);


--
-- Name: Invoice_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Invoice_type_idx" ON public."Invoice" USING btree (type);


--
-- Name: JobOpening_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JobOpening_companyId_idx" ON public."JobOpening" USING btree ("companyId");


--
-- Name: JobOpening_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JobOpening_status_idx" ON public."JobOpening" USING btree (status);


--
-- Name: JournalEntryLine_accountId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JournalEntryLine_accountId_idx" ON public."JournalEntryLine" USING btree ("accountId");


--
-- Name: JournalEntryLine_journalEntryId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JournalEntryLine_journalEntryId_idx" ON public."JournalEntryLine" USING btree ("journalEntryId");


--
-- Name: JournalEntry_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JournalEntry_companyId_idx" ON public."JournalEntry" USING btree ("companyId");


--
-- Name: JournalEntry_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "JournalEntry_date_idx" ON public."JournalEntry" USING btree (date);


--
-- Name: LeadActivity_assignedTo_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_assignedTo_idx" ON public."LeadActivity" USING btree ("assignedTo");


--
-- Name: LeadActivity_dueDate_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_dueDate_idx" ON public."LeadActivity" USING btree ("dueDate");


--
-- Name: LeadActivity_leadId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_leadId_idx" ON public."LeadActivity" USING btree ("leadId");


--
-- Name: LeadActivity_scheduledAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_scheduledAt_idx" ON public."LeadActivity" USING btree ("scheduledAt");


--
-- Name: LeadActivity_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_status_idx" ON public."LeadActivity" USING btree (status);


--
-- Name: LeadActivity_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeadActivity_type_idx" ON public."LeadActivity" USING btree (type);


--
-- Name: Lead_assignedTo_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_assignedTo_idx" ON public."Lead" USING btree ("assignedTo");


--
-- Name: Lead_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_companyId_idx" ON public."Lead" USING btree ("companyId");


--
-- Name: Lead_createdBy_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_createdBy_idx" ON public."Lead" USING btree ("createdBy");


--
-- Name: Lead_nextFollowUpAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_nextFollowUpAt_idx" ON public."Lead" USING btree ("nextFollowUpAt");


--
-- Name: Lead_stage_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_stage_idx" ON public."Lead" USING btree (stage);


--
-- Name: Lead_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Lead_status_idx" ON public."Lead" USING btree (status);


--
-- Name: LeaveAccrual_employeeId_leaveTypeId_year_month_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "LeaveAccrual_employeeId_leaveTypeId_year_month_key" ON public."LeaveAccrual" USING btree ("employeeId", "leaveTypeId", year, month);


--
-- Name: LeaveAccrual_employeeId_year_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveAccrual_employeeId_year_idx" ON public."LeaveAccrual" USING btree ("employeeId", year);


--
-- Name: LeaveAccrual_leaveTypeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveAccrual_leaveTypeId_idx" ON public."LeaveAccrual" USING btree ("leaveTypeId");


--
-- Name: LeaveRequest_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveRequest_employeeId_idx" ON public."LeaveRequest" USING btree ("employeeId");


--
-- Name: LeaveRequest_startDate_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveRequest_startDate_idx" ON public."LeaveRequest" USING btree ("startDate");


--
-- Name: LeaveRequest_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveRequest_status_idx" ON public."LeaveRequest" USING btree (status);


--
-- Name: LeaveType_name_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LeaveType_name_idx" ON public."LeaveType" USING btree (name);


--
-- Name: LeaveType_name_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "LeaveType_name_key" ON public."LeaveType" USING btree (name);


--
-- Name: LedgerAccount_companyId_code_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "LedgerAccount_companyId_code_key" ON public."LedgerAccount" USING btree ("companyId", code);


--
-- Name: LedgerAccount_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "LedgerAccount_companyId_idx" ON public."LedgerAccount" USING btree ("companyId");


--
-- Name: Milestone_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Milestone_projectId_idx" ON public."Milestone" USING btree ("projectId");


--
-- Name: OfferLetter_candidateId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "OfferLetter_candidateId_idx" ON public."OfferLetter" USING btree ("candidateId");


--
-- Name: OfferLetter_candidateId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "OfferLetter_candidateId_key" ON public."OfferLetter" USING btree ("candidateId");


--
-- Name: OfferLetter_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "OfferLetter_status_idx" ON public."OfferLetter" USING btree (status);


--
-- Name: Payment_invoiceId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Payment_invoiceId_idx" ON public."Payment" USING btree ("invoiceId");


--
-- Name: Payment_paymentDate_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Payment_paymentDate_idx" ON public."Payment" USING btree ("paymentDate");


--
-- Name: Payment_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Payment_status_idx" ON public."Payment" USING btree (status);


--
-- Name: Payment_transactionId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Payment_transactionId_idx" ON public."Payment" USING btree ("transactionId");


--
-- Name: Payment_transactionId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Payment_transactionId_key" ON public."Payment" USING btree ("transactionId");


--
-- Name: Payroll_year_month_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Payroll_year_month_idx" ON public."Payroll" USING btree (year, month);


--
-- Name: Policy_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Policy_companyId_idx" ON public."Policy" USING btree ("companyId");


--
-- Name: Position_departmentId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Position_departmentId_idx" ON public."Position" USING btree ("departmentId");


--
-- Name: Position_departmentId_title_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Position_departmentId_title_key" ON public."Position" USING btree ("departmentId", title);


--
-- Name: ProjectMember_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ProjectMember_employeeId_idx" ON public."ProjectMember" USING btree ("employeeId");


--
-- Name: ProjectMember_projectId_employeeId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "ProjectMember_projectId_employeeId_key" ON public."ProjectMember" USING btree ("projectId", "employeeId");


--
-- Name: ProjectMember_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ProjectMember_projectId_idx" ON public."ProjectMember" USING btree ("projectId");


--
-- Name: ProjectNote_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ProjectNote_projectId_idx" ON public."ProjectNote" USING btree ("projectId");


--
-- Name: Project_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Project_clientId_idx" ON public."Project" USING btree ("clientId");


--
-- Name: Project_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Project_companyId_idx" ON public."Project" USING btree ("companyId");


--
-- Name: Project_createdAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Project_createdAt_idx" ON public."Project" USING btree ("createdAt");


--
-- Name: Project_startDate_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Project_startDate_idx" ON public."Project" USING btree ("startDate");


--
-- Name: Project_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Project_status_idx" ON public."Project" USING btree (status);


--
-- Name: QuotationActivity_createdAt_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationActivity_createdAt_idx" ON public."QuotationActivity" USING btree ("createdAt");


--
-- Name: QuotationActivity_quotationId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationActivity_quotationId_idx" ON public."QuotationActivity" USING btree ("quotationId");


--
-- Name: QuotationActivity_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationActivity_type_idx" ON public."QuotationActivity" USING btree (type);


--
-- Name: QuotationItemTax_quotationItemId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationItemTax_quotationItemId_idx" ON public."QuotationItemTax" USING btree ("quotationItemId");


--
-- Name: QuotationItemTax_taxRateId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationItemTax_taxRateId_idx" ON public."QuotationItemTax" USING btree ("taxRateId");


--
-- Name: QuotationItem_quotationId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationItem_quotationId_idx" ON public."QuotationItem" USING btree ("quotationId");


--
-- Name: QuotationItem_taxRateId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationItem_taxRateId_idx" ON public."QuotationItem" USING btree ("taxRateId");


--
-- Name: Quotation_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Quotation_clientId_idx" ON public."Quotation" USING btree ("clientId");


--
-- Name: Quotation_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Quotation_companyId_idx" ON public."Quotation" USING btree ("companyId");


--
-- Name: Quotation_companyId_quotationNumber_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Quotation_companyId_quotationNumber_key" ON public."Quotation" USING btree ("companyId", "quotationNumber");


--
-- Name: Quotation_leadId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Quotation_leadId_idx" ON public."Quotation" USING btree ("leadId");


--
-- Name: Quotation_publicToken_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Quotation_publicToken_key" ON public."Quotation" USING btree ("publicToken");


--
-- Name: Quotation_quotationNumber_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON public."Quotation" USING btree ("quotationNumber");


--
-- Name: Quotation_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Quotation_status_idx" ON public."Quotation" USING btree (status);


--
-- Name: RolePermission_roleId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "RolePermission_roleId_idx" ON public."RolePermission" USING btree ("roleId");


--
-- Name: RolePermission_roleId_module_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "RolePermission_roleId_module_key" ON public."RolePermission" USING btree ("roleId", module);


--
-- Name: Role_name_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Role_name_idx" ON public."Role" USING btree (name);


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: SalaryComponent_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "SalaryComponent_companyId_idx" ON public."SalaryComponent" USING btree ("companyId");


--
-- Name: SalesTarget_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "SalesTarget_companyId_idx" ON public."SalesTarget" USING btree ("companyId");


--
-- Name: SalesTarget_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "SalesTarget_employeeId_idx" ON public."SalesTarget" USING btree ("employeeId");


--
-- Name: SalesTarget_period_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "SalesTarget_period_idx" ON public."SalesTarget" USING btree (period);


--
-- Name: ShiftRoster_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ShiftRoster_date_idx" ON public."ShiftRoster" USING btree (date);


--
-- Name: ShiftRoster_employeeId_date_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "ShiftRoster_employeeId_date_key" ON public."ShiftRoster" USING btree ("employeeId", date);


--
-- Name: ShiftRoster_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "ShiftRoster_employeeId_idx" ON public."ShiftRoster" USING btree ("employeeId");


--
-- Name: Shift_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Shift_companyId_idx" ON public."Shift" USING btree ("companyId");


--
-- Name: Sprint_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Sprint_projectId_idx" ON public."Sprint" USING btree ("projectId");


--
-- Name: Sprint_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Sprint_status_idx" ON public."Sprint" USING btree (status);


--
-- Name: StatutoryConfig_companyId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "StatutoryConfig_companyId_key" ON public."StatutoryConfig" USING btree ("companyId");


--
-- Name: Subscription_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Subscription_clientId_idx" ON public."Subscription" USING btree ("clientId");


--
-- Name: Subscription_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Subscription_companyId_idx" ON public."Subscription" USING btree ("companyId");


--
-- Name: Subscription_nextBillingDate_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Subscription_nextBillingDate_idx" ON public."Subscription" USING btree ("nextBillingDate");


--
-- Name: Subscription_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Subscription_status_idx" ON public."Subscription" USING btree (status);


--
-- Name: TaskComment_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TaskComment_clientId_idx" ON public."TaskComment" USING btree ("clientId");


--
-- Name: TaskComment_parentId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TaskComment_parentId_idx" ON public."TaskComment" USING btree ("parentId");


--
-- Name: TaskComment_taskId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TaskComment_taskId_idx" ON public."TaskComment" USING btree ("taskId");


--
-- Name: TaskComment_userId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TaskComment_userId_idx" ON public."TaskComment" USING btree ("userId");


--
-- Name: TaskHistory_taskId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TaskHistory_taskId_idx" ON public."TaskHistory" USING btree ("taskId");


--
-- Name: TaskLink_sourceId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TaskLink_sourceId_idx" ON public."TaskLink" USING btree ("sourceId");


--
-- Name: TaskLink_targetId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TaskLink_targetId_idx" ON public."TaskLink" USING btree ("targetId");


--
-- Name: TaskWatcher_taskId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TaskWatcher_taskId_idx" ON public."TaskWatcher" USING btree ("taskId");


--
-- Name: TaskWatcher_taskId_userId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "TaskWatcher_taskId_userId_key" ON public."TaskWatcher" USING btree ("taskId", "userId");


--
-- Name: TaskWatcher_userId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TaskWatcher_userId_idx" ON public."TaskWatcher" USING btree ("userId");


--
-- Name: Task_assignedToId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_assignedToId_idx" ON public."Task" USING btree ("assignedToId");


--
-- Name: Task_createdById_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_createdById_idx" ON public."Task" USING btree ("createdById");


--
-- Name: Task_createdClientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_createdClientId_idx" ON public."Task" USING btree ("createdClientId");


--
-- Name: Task_epicId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_epicId_idx" ON public."Task" USING btree ("epicId");


--
-- Name: Task_milestoneId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_milestoneId_idx" ON public."Task" USING btree ("milestoneId");


--
-- Name: Task_parentId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_parentId_idx" ON public."Task" USING btree ("parentId");


--
-- Name: Task_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_projectId_idx" ON public."Task" USING btree ("projectId");


--
-- Name: Task_sprintId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_sprintId_idx" ON public."Task" USING btree ("sprintId");


--
-- Name: Task_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_status_idx" ON public."Task" USING btree (status);


--
-- Name: Task_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_type_idx" ON public."Task" USING btree (type);


--
-- Name: TaxRate_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TaxRate_companyId_idx" ON public."TaxRate" USING btree ("companyId");


--
-- Name: TicketComment_ticketId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TicketComment_ticketId_idx" ON public."TicketComment" USING btree ("ticketId");


--
-- Name: TicketMessage_ticketId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "TicketMessage_ticketId_idx" ON public."TicketMessage" USING btree ("ticketId");


--
-- Name: Ticket_assignedToId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Ticket_assignedToId_idx" ON public."Ticket" USING btree ("assignedToId");


--
-- Name: Ticket_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Ticket_companyId_idx" ON public."Ticket" USING btree ("companyId");


--
-- Name: Ticket_createdById_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Ticket_createdById_idx" ON public."Ticket" USING btree ("createdById");


--
-- Name: Ticket_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Ticket_status_idx" ON public."Ticket" USING btree (status);


--
-- Name: Timesheet_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Timesheet_companyId_idx" ON public."Timesheet" USING btree ("companyId");


--
-- Name: Timesheet_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Timesheet_date_idx" ON public."Timesheet" USING btree (date);


--
-- Name: Timesheet_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Timesheet_employeeId_idx" ON public."Timesheet" USING btree ("employeeId");


--
-- Name: Timesheet_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Timesheet_projectId_idx" ON public."Timesheet" USING btree ("projectId");


--
-- Name: Timesheet_taskId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Timesheet_taskId_idx" ON public."Timesheet" USING btree ("taskId");


--
-- Name: Transaction_accountId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Transaction_accountId_idx" ON public."Transaction" USING btree ("accountId");


--
-- Name: Transaction_date_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Transaction_date_idx" ON public."Transaction" USING btree (date);


--
-- Name: Transaction_reference_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Transaction_reference_idx" ON public."Transaction" USING btree (reference);


--
-- Name: UnitType_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "UnitType_companyId_idx" ON public."UnitType" USING btree ("companyId");


--
-- Name: UserRole_roleId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "UserRole_roleId_idx" ON public."UserRole" USING btree ("roleId");


--
-- Name: UserRole_userId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "UserRole_userId_idx" ON public."UserRole" USING btree ("userId");


--
-- Name: UserRole_userId_roleId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON public."UserRole" USING btree ("userId", "roleId");


--
-- Name: User_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "User_companyId_idx" ON public."User" USING btree ("companyId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: active_timers_employeeId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "active_timers_employeeId_idx" ON public.active_timers USING btree ("employeeId");


--
-- Name: notifications_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "notifications_companyId_idx" ON public.notifications USING btree ("companyId");


--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- Name: quotation_templates_category_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX quotation_templates_category_idx ON public.quotation_templates USING btree (category);


--
-- Name: quotation_templates_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "quotation_templates_companyId_idx" ON public.quotation_templates USING btree ("companyId");


--
-- Name: Asset Asset_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Asset Asset_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Attendance Attendance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AutomationRule AutomationRule_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."AutomationRule"
    ADD CONSTRAINT "AutomationRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Branch Branch_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Candidate Candidate_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT "Candidate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Candidate Candidate_jobOpeningId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT "Candidate_jobOpeningId_fkey" FOREIGN KEY ("jobOpeningId") REFERENCES public."JobOpening"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClientCategory ClientCategory_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ClientCategory"
    ADD CONSTRAINT "ClientCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClientSubCategory ClientSubCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ClientSubCategory"
    ADD CONSTRAINT "ClientSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ClientCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Client Client_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ClientCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Client Client_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Client Client_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Client Client_subCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES public."ClientSubCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ContractActivity ContractActivity_contractId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ContractActivity"
    ADD CONSTRAINT "ContractActivity_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES public."Contract"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ContractTemplate ContractTemplate_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ContractTemplate"
    ADD CONSTRAINT "ContractTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contract Contract_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contract Contract_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contract Contract_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Contract Contract_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Contract Contract_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."ContractTemplate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Department Department_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DocumentTemplate DocumentTemplate_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."DocumentTemplate"
    ADD CONSTRAINT "DocumentTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmailTemplate EmailTemplate_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmailTemplate"
    ADD CONSTRAINT "EmailTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeLeaveBalance EmployeeLeaveBalance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeLeaveBalance"
    ADD CONSTRAINT "EmployeeLeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeLeaveBalance EmployeeLeaveBalance_leaveTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeLeaveBalance"
    ADD CONSTRAINT "EmployeeLeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES public."LeaveType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeSalaryComponent EmployeeSalaryComponent_componentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeSalaryComponent"
    ADD CONSTRAINT "EmployeeSalaryComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES public."SalaryComponent"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EmployeeSalaryComponent EmployeeSalaryComponent_structureId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeSalaryComponent"
    ADD CONSTRAINT "EmployeeSalaryComponent_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES public."EmployeeSalaryStructure"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeSalaryStructure EmployeeSalaryStructure_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."EmployeeSalaryStructure"
    ADD CONSTRAINT "EmployeeSalaryStructure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Employee Employee_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Employee Employee_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public."Position"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_shiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES public."Shift"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InterviewScorecard InterviewScorecard_interviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InterviewScorecard"
    ADD CONSTRAINT "InterviewScorecard_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES public."Interview"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Interview Interview_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Interview"
    ADD CONSTRAINT "Interview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."Candidate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InvoiceActivity InvoiceActivity_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InvoiceActivity"
    ADD CONSTRAINT "InvoiceActivity_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InvoiceItemTax InvoiceItemTax_invoiceItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InvoiceItemTax"
    ADD CONSTRAINT "InvoiceItemTax_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES public."InvoiceItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InvoiceItemTax InvoiceItemTax_taxRateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InvoiceItemTax"
    ADD CONSTRAINT "InvoiceItemTax_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES public."TaxRate"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InvoiceItem InvoiceItem_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InvoiceItem InvoiceItem_taxRateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES public."TaxRate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invoice Invoice_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: JobOpening JobOpening_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JobOpening"
    ADD CONSTRAINT "JobOpening_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JournalEntryLine JournalEntryLine_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JournalEntryLine"
    ADD CONSTRAINT "JournalEntryLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."LedgerAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JournalEntryLine JournalEntryLine_journalEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JournalEntryLine"
    ADD CONSTRAINT "JournalEntryLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES public."JournalEntry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JournalEntry JournalEntry_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeadActivity LeadActivity_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeadActivity"
    ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lead Lead_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Lead Lead_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lead Lead_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LeaveAccrual LeaveAccrual_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveAccrual"
    ADD CONSTRAINT "LeaveAccrual_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveAccrual LeaveAccrual_leaveTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveAccrual"
    ADD CONSTRAINT "LeaveAccrual_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES public."LeaveType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveRequest LeaveRequest_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveRequest LeaveRequest_leaveTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES public."LeaveType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LedgerAccount LedgerAccount_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."LedgerAccount"
    ADD CONSTRAINT "LedgerAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Milestone Milestone_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Milestone"
    ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OfferLetter OfferLetter_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."OfferLetter"
    ADD CONSTRAINT "OfferLetter_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."Candidate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payroll Payroll_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Payroll"
    ADD CONSTRAINT "Payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Policy Policy_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Policy"
    ADD CONSTRAINT "Policy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Policy Policy_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Policy"
    ADD CONSTRAINT "Policy_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Position Position_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProjectMember ProjectMember_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ProjectMember"
    ADD CONSTRAINT "ProjectMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProjectMember ProjectMember_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ProjectMember"
    ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProjectNote ProjectNote_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ProjectNote"
    ADD CONSTRAINT "ProjectNote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProjectNote ProjectNote_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ProjectNote"
    ADD CONSTRAINT "ProjectNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Project Project_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Project Project_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuotationActivity QuotationActivity_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationActivity"
    ADD CONSTRAINT "QuotationActivity_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public."Quotation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuotationItemTax QuotationItemTax_quotationItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationItemTax"
    ADD CONSTRAINT "QuotationItemTax_quotationItemId_fkey" FOREIGN KEY ("quotationItemId") REFERENCES public."QuotationItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuotationItemTax QuotationItemTax_taxRateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationItemTax"
    ADD CONSTRAINT "QuotationItemTax_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES public."TaxRate"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuotationItem QuotationItem_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public."Quotation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuotationItem QuotationItem_taxRateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES public."TaxRate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quotation Quotation_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quotation Quotation_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quotation Quotation_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quotation Quotation_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quotation Quotation_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalaryComponent SalaryComponent_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."SalaryComponent"
    ADD CONSTRAINT "SalaryComponent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalesTarget SalesTarget_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."SalesTarget"
    ADD CONSTRAINT "SalesTarget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalesTarget SalesTarget_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."SalesTarget"
    ADD CONSTRAINT "SalesTarget_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShiftRoster ShiftRoster_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ShiftRoster"
    ADD CONSTRAINT "ShiftRoster_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShiftRoster ShiftRoster_shiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."ShiftRoster"
    ADD CONSTRAINT "ShiftRoster_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES public."Shift"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Shift Shift_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Shift"
    ADD CONSTRAINT "Shift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sprint Sprint_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Sprint"
    ADD CONSTRAINT "Sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StatutoryConfig StatutoryConfig_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."StatutoryConfig"
    ADD CONSTRAINT "StatutoryConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Subscription Subscription_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaskComment TaskComment_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskComment"
    ADD CONSTRAINT "TaskComment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TaskComment TaskComment_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskComment"
    ADD CONSTRAINT "TaskComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."TaskComment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaskComment TaskComment_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskComment"
    ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaskComment TaskComment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskComment"
    ADD CONSTRAINT "TaskComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TaskHistory TaskHistory_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskHistory"
    ADD CONSTRAINT "TaskHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TaskHistory TaskHistory_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskHistory"
    ADD CONSTRAINT "TaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaskHistory TaskHistory_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskHistory"
    ADD CONSTRAINT "TaskHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TaskLink TaskLink_sourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskLink"
    ADD CONSTRAINT "TaskLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaskLink TaskLink_targetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskLink"
    ADD CONSTRAINT "TaskLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaskWatcher TaskWatcher_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskWatcher"
    ADD CONSTRAINT "TaskWatcher_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaskWatcher TaskWatcher_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaskWatcher"
    ADD CONSTRAINT "TaskWatcher_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_createdClientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_createdClientId_fkey" FOREIGN KEY ("createdClientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_epicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_milestoneId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES public."Milestone"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_sprintId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES public."Sprint"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TaxRate TaxRate_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TaxRate"
    ADD CONSTRAINT "TaxRate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketComment TicketComment_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TicketComment"
    ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketComment TicketComment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TicketComment"
    ADD CONSTRAINT "TicketComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TicketMessage TicketMessage_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TicketMessage TicketMessage_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Timesheet Timesheet_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Timesheet"
    ADD CONSTRAINT "Timesheet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Timesheet Timesheet_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Timesheet"
    ADD CONSTRAINT "Timesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Timesheet Timesheet_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Timesheet"
    ADD CONSTRAINT "Timesheet_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UnitType UnitType_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."UnitType"
    ADD CONSTRAINT "UnitType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRole UserRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRole UserRole_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: active_timers active_timers_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public.active_timers
    ADD CONSTRAINT "active_timers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: active_timers active_timers_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public.active_timers
    ADD CONSTRAINT "active_timers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: active_timers active_timers_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public.active_timers
    ADD CONSTRAINT "active_timers_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quotation_templates quotation_templates_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public.quotation_templates
    ADD CONSTRAINT "quotation_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: applizor
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 7FHeYthiCq8iTBQH3creHSUJhHo9pSVPVIv0IefbigGYfQRF8Cc98Mn6J1FwDBd

