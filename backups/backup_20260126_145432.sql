--
-- PostgreSQL database dump
--

\restrict Txfifcc0vqlEXOh5pcOX1ljHZTHYPITOdeYdFeqmVduumDmin4EqAtMgs2waS3n

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
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "lastLogin" timestamp(3) without time zone
);


ALTER TABLE public."Client" OWNER TO applizor;

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
    "pdfMarginTop" integer DEFAULT 180 NOT NULL
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
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Document" OWNER TO applizor;

--
-- Name: DocumentTemplate; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."DocumentTemplate" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    "filePath" text NOT NULL,
    "letterheadMode" text DEFAULT 'NONE'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "probationProcessed" boolean DEFAULT false NOT NULL
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
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    currency text DEFAULT 'USD'::text NOT NULL,
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
    "recurringInterval" text
);


ALTER TABLE public."Invoice" OWNER TO applizor;

--
-- Name: InvoiceItem; Type: TABLE; Schema: public; Owner: applizor
--

CREATE TABLE public."InvoiceItem" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    description text NOT NULL,
    "hsnCode" text,
    quantity numeric(10,2) NOT NULL,
    rate numeric(12,2) NOT NULL,
    "taxRate" numeric(5,2) DEFAULT 0 NOT NULL,
    amount numeric(12,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."InvoiceItem" OWNER TO applizor;

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
    website text
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
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Project" OWNER TO applizor;

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
    total numeric(12,2) NOT NULL
);


ALTER TABLE public."QuotationItem" OWNER TO applizor;

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
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "createdById" text NOT NULL,
    "assignedToId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Task" OWNER TO applizor;

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
    "updatedAt" timestamp(3) without time zone NOT NULL
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

COPY public."Asset" (id, "companyId", name, type, "serialNumber", status, "purchaseDate", price, "employeeId", "assignedDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Attendance" (id, "employeeId", date, "checkIn", "checkOut", status, "ipAddress", location, notes, "createdAt", "updatedAt") FROM stdin;
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
\.


--
-- Data for Name: Client; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Client" (id, "companyId", name, email, phone, address, city, state, country, pincode, gstin, pan, status, "clientType", "createdAt", "updatedAt", password, "portalAccess", "lastLogin") FROM stdin;
b5fbcbfd-deb9-421b-9932-fb1420d0562a	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Arun Kumar Vishwakarma	arun1601for@gmail.com	+919226889662	404 VARADRAJ HEIGHTS\nSHIVTIRTH NAGAR MARUNJI ROAD HINJEWADI PHASE 1	PUNE	Maharashtra	India	411057			active	customer	2026-01-23 04:35:58.81	2026-01-26 07:47:05.233	$2a$10$tQX0Zc8m2hdJKeRY5j9okuwtz/4Qxxeb2jKjjkqXuCd7SRWx4iKZS	t	2026-01-26 07:47:05.232
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Company" (id, name, "legalName", email, phone, address, city, state, country, pincode, gstin, pan, logo, "letterheadDoc", "allowedIPs", latitude, longitude, radius, "isActive", "enabledModules", "createdAt", "updatedAt", currency, tan, "continuationSheet", "digitalSignature", letterhead, "pdfContinuationTop", "pdfMarginBottom", "pdfMarginLeft", "pdfMarginRight", "pdfMarginTop") FROM stdin;
b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Applizor Softech LLP	Applizor Softech LLP	connect@applizor.com	9130309480	209, WARD NO 7, VISHWAKARMA MUHALLA, GARROLI	Chhatarpur	Madhya Pradesh	India	471201	27AAAAA0000A1Z5	\N	/uploads/logos/logo-1769142517693-126258508.png	\N	\N	\N	\N	100	t	null	2026-01-23 04:26:48.633	2026-01-23 05:22:12.815	INR	\N	/uploads/letterheads/continuationSheet-1769142583385-342094364.pdf	/uploads/signatures/signature-1769142563754-622063357.png	/uploads/letterheads/letterhead-1769142579407-299075121.pdf	130	60	50	50	130
\.


--
-- Data for Name: Contract; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Contract" (id, "companyId", "clientId", "projectId", "creatorId", title, content, status, "validFrom", "validUntil", "sentAt", "signedAt", "clientSignature", "signerName", "signerIp", "companySignature", "companySignerId", "companySignedAt", "pdfPath", "templateId", "createdAt", "updatedAt", "viewCount", "lastViewedAt", "emailOpens", "lastEmailOpenedAt", "contractType", "contractValue", currency) FROM stdin;
\.


--
-- Data for Name: ContractActivity; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ContractActivity" (id, "contractId", type, "ipAddress", "userAgent", location, "deviceType", browser, os, metadata, "createdAt") FROM stdin;
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

COPY public."Document" (id, "companyId", "clientId", "invoiceId", "employeeId", "projectId", name, type, category, "filePath", "fileSize", "mimeType", version, "isTemplate", tags, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DocumentTemplate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."DocumentTemplate" (id, "companyId", name, description, type, "filePath", "letterheadMode", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EmailTemplate; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmailTemplate" (id, "companyId", name, subject, body, type, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Employee" (id, "companyId", "userId", "employeeId", "firstName", "lastName", email, phone, gender, "bloodGroup", "maritalStatus", "dateOfBirth", "dateOfJoining", "currentAddress", "permanentAddress", "emergencyContact", "bankName", "accountNumber", "ifscCode", "panNumber", "aadhaarNumber", "departmentId", "positionId", "shiftId", salary, "salaryStructure", status, "createdAt", "updatedAt", "createdById", "employmentType", "hourlyRate", "noticePeriodEndDate", "noticePeriodStartDate", "probationEndDate", skills, "slackMemberId", "probationProcessed") FROM stdin;
\.


--
-- Data for Name: EmployeeLeaveBalance; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmployeeLeaveBalance" (id, "employeeId", "leaveTypeId", year, allocated, "carriedOver", used, "createdAt", "updatedAt") FROM stdin;
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
\.


--
-- Data for Name: Interview; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Interview" (id, "candidateId", round, type, "scheduledAt", interviewer, feedback, rating, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: InterviewScorecard; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."InterviewScorecard" (id, "interviewId", technical, communication, "problemSolving", "cultureFit", comments, "submittedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Invoice" (id, "companyId", "clientId", "invoiceNumber", "invoiceDate", "dueDate", status, type, currency, terms, subtotal, tax, discount, total, "paidAmount", "isRecurring", "recurringId", notes, "pdfPath", "createdAt", "updatedAt", "nextOccurrence", "projectId", "recurringInterval") FROM stdin;
f0fdc3b7-dd0d-4d22-9ba3-db81214f6a14	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	b5fbcbfd-deb9-421b-9932-fb1420d0562a	INV-2026-0001	2026-01-23	2026-02-22	draft	invoice	USD	\N	120000.00	21600.00	0.00	141600.00	0.00	f	\N	\N	\N	2026-01-23 05:25:50.693	2026-01-23 05:25:50.693	\N	\N	\N
\.


--
-- Data for Name: InvoiceItem; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."InvoiceItem" (id, "invoiceId", description, "hsnCode", quantity, rate, "taxRate", amount, "createdAt") FROM stdin;
d7b70270-8138-4755-a80e-57e80a9ea30f	f0fdc3b7-dd0d-4d22-9ba3-db81214f6a14	Website Development (React.js + Spring Boot)	\N	1.00	60000.00	18.00	60000.00	2026-01-23 05:25:50.693
6ffa90c1-e655-4773-af07-5b4773428865	f0fdc3b7-dd0d-4d22-9ba3-db81214f6a14	Mobile App Development (React Native)	\N	1.00	60000.00	18.00	60000.00	2026-01-23 05:25:50.693
\.


--
-- Data for Name: JobOpening; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."JobOpening" (id, "companyId", title, department, "position", description, requirements, status, "createdAt", "updatedAt") FROM stdin;
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

COPY public."Lead" (id, "companyId", name, email, phone, company, source, status, stage, value, notes, "assignedTo", "createdAt", "updatedAt", "assignedAt", "convertedAt", "convertedToClientId", "createdBy", industry, "jobTitle", "lastContactedAt", "nextFollowUpAt", priority, probability, "sourceDetails", tags, website) FROM stdin;
1057847e-2fde-4372-baa2-7a96b374d995	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Arun Kumar Vishwakarma	arun1601for@gmail.com	+919226889662	dr upchar	website	won	closed	5000.00		b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-23 04:35:38.882	2026-01-23 04:35:58.824	\N	2026-01-23 04:35:58.822	b5fbcbfd-deb9-421b-9932-fb1420d0562a	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9			\N	\N	medium	0		{}	drupchar.com
\.


--
-- Data for Name: LeadActivity; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LeadActivity" (id, "leadId", type, title, description, outcome, "scheduledAt", "completedAt", "dueDate", "reminderSent", "reminderTime", "assignedTo", "createdBy", status, "createdAt", "updatedAt") FROM stdin;
7af03916-e318-4660-8962-d6146747313a	1057847e-2fde-4372-baa2-7a96b374d995	conversion	Lead converted to client	Client ID: b5fbcbfd-deb9-421b-9932-fb1420d0562a	\N	\N	\N	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	pending	2026-01-23 04:35:58.833	2026-01-23 04:35:58.833
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
-- Data for Name: OfferLetter; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."OfferLetter" (id, "candidateId", "position", department, salary, "startDate", status, "documentPath", "createdAt", "updatedAt") FROM stdin;
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
-- Data for Name: Position; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Position" (id, "departmentId", title, description, "isActive", "createdAt", "updatedAt") FROM stdin;
020858a5-3766-4388-99cb-39f9af2c2879	a9e50298-d5db-4b87-8ab6-a8e12194321d	Senior Software Engineer	\N	t	2026-01-23 04:26:48.816	2026-01-23 04:26:48.816
72eac940-3040-462e-8736-cf9f43547af2	80f8b173-8253-4dff-be66-3b8229770117	HR Manager	\N	t	2026-01-23 04:26:48.829	2026-01-23 04:26:48.829
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Project" (id, "companyId", "clientId", name, description, status, "startDate", "endDate", budget, "isBillable", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Quotation; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Quotation" (id, "companyId", "leadId", "clientId", "quotationNumber", title, description, "quotationDate", "validUntil", status, subtotal, tax, discount, total, currency, "paymentTerms", "deliveryTerms", notes, "pdfPath", "templateId", "publicToken", "publicExpiresAt", "isPublicEnabled", "clientViewedAt", "clientAcceptedAt", "clientRejectedAt", "clientSignature", "clientEmail", "clientName", "clientComments", "signedPdfPath", "convertedToInvoiceId", "convertedAt", "createdBy", "assignedTo", "createdAt", "updatedAt", "emailOpens", "lastEmailOpenedAt", "lastViewedAt", "viewCount", "maxReminders", "nextReminderAt", "reminderCount", "reminderFrequency") FROM stdin;
44986153-22fb-4010-a0e4-a8c3ccb97f6b	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	1057847e-2fde-4372-baa2-7a96b374d995	b5fbcbfd-deb9-421b-9932-fb1420d0562a	QUO-2026-0001	News Website And Video Streaming App	<p>Applizor Softech LLP is pleased to present this proposal for developing a fully functional, self-hosted video news platform for Peptech Time. This platform will include a feature-rich website and mobile apps for Android, iOS, and Android TV.</p><p>Our focus is to deliver a seamless experience where users can read news articles and stream news videos — with complete control over content and monetization.</p><h4><strong>Project Timeline</strong></h4><p>Website Development 4–5 Weeks</p><p>Android &amp; iOS App 2–3 Weeks</p><p>Android TV App 1–2 Weeks</p><p><br></p><p><strong>Website Development (React.js + Spring Boot)</strong></p><p>Infrastructure Setup</p><p>VPS/Cloud hosting setup (DigitalOcean/Linode)</p><p>CDN configuration (Cloudflare)</p><p>Media storage integration (Amazon S3 or Wasabi)</p><p>Platform Setup</p><p>React.js frontend with SEO support</p><p>Spring Boot backend with REST APIs</p><p>Admin dashboard for managing reporters, news, and media</p><p>News &amp; Video Content</p><p>Post multilingual news articles (Hindi, English, Hinglish)</p><p>Upload self-hosted videos via admin panel</p><p>Use custom HLS video player (Video.js or Shaka Player)</p><p>Live streaming setup using RTMP + HLS</p><p>Reporter System</p><p>Create reporter login system</p><p>Reporters can post text + video-based news</p><p>Approval system by admin before publish</p><p>User Engagement &amp; Monetization</p><p>Push notification integration</p><p>Social sharing (WhatsApp, Telegram)</p><p>Donation support via Razorpay/Instamojo</p><p>Video ads (VAST tag support)</p><p>Option to add affiliate links and banners</p><p>Security &amp; Performance</p><p>JWT authentication</p><p>SSL certificate, secure API practices</p><p>Caching, image compression, lazy loading</p><p>Regular backups and system monitoring</p><p><br></p><p><strong>Mobile App Development (React Native)</strong></p><p>﻿for Android, iOS &amp; Android TV – single codebase using React Native)</p><p>Platforms</p><p>Android Phone/Tablet App iOS App</p><p>Android TV App (custom layout and controls)</p><p>Core Features</p><p>Stream videos using HLS format</p><p>News article viewer with multilingual support</p><p>Push notifications for breaking news</p><p>User login and donation integration</p><p>Offline download support (optional)</p><p>Chromecast &amp; Android TV playback support</p><p>Security &amp; Optimization</p><p>Encrypted API communication</p><p>Optimized UI/UX for speed and responsiveness</p><p>Play Store &amp; App Store compliance</p><p>Scalability</p><p>Support for future features like:</p><p>AI-based subtitles</p><p>Scheduled publishing</p><p>Personalized content suggestions</p>	2026-01-23	2026-01-31	accepted	120000.00	21600.00	0.00	141600.00	INR	Payment due within 30 days. \n50% Advance to start work.	Delivery via Email/Cloud Link.	This quotation is valid for 15 days.	\N	\N	4ceac616-4216-4559-bc4b-7398a3682e5f	2026-02-22 05:24:14.871	t	2026-01-23 05:24:25.53	2026-01-23 05:24:43.541	\N	data:image/png;base64,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xRdt4MCB9uqrr5qOM3bsWHvuuefsnXfesUGDBtlnn33mnPObb75xyvX+gw8+sGHDhtmPP/7otNHdNuq39tNzMPQdfu2115wL99Zbb5m277//3q655hrTcyPGjBljF154oQ0ZMsT5vN9666320EMPWbt27ezhhx+2yy67zO699167/PLLrVmzZrbvvvvannvuaUpdpWdv6IHSe+yxh9WqVct23XVXZ6tZs6bttttuzuu///3vzj5169a1oqIia9CggVN39NFHm8r026Pj6e/hhx/u1J9//vnO8S699FJr2rSp7bPPPnb77bfbwQcf7Jz3kUcesZKSEqdM10Dt+/fvb1dccYV1797dcZCJNl2np59+2v7xj3+YXGSiazlv3jzbvHmz48J/QirAsBAoI6DJ+qOOOsqOPPJI5zfsrLPOKlPLSwQQQAABBBBAAAEEgi9AQD/415ARpClQqLsp6FatWrWY4W+//fYxZWEr0Ep9BQWrVq0aMzQFVZcuXRpTToF/BBScVqBd10nB8EmTJtlHH33kBL6/+OILJ/CtgG63bt2sbdu2TsD33HPPtUsuucQJGtevX99q165t9erVMwWiten5CvrsH3bYYVajRg3bf//9naCyvicKCGl/Bbw7depkCiZfffXVdv311zuvO3bsWO71ddddZ6WlpXbXXXc52x133GEKmt90003WpUsX01/tf+ONN5oC0jfccIMTYNdxzj77bNNk02mnneYE4BXc1jkVTFe53p944olOsF2BdQXpFTBXv1WvoPrJJ59sbdq0sTPOOMOUTkrbEUcc4QS9e/bsaa1bt3YmENq3b+9MMGiyQUFxBcJl9tJLL9ndd9/tTBpMmTLFFi1a5Kxu1aSCnrOhiYTly5fb6tWr7eeff3Y23fmyYsUK57Wujfb56aefTNdKEw6q07VR2eTJk53j6e/06dNN9ZoY0fFefvllZxJDAXhNeCggp/PefPPNTsosPQtDHmrftWtXZ0JEkxFy0ASENl2na6+91k455RSTy0477eRcywMOOMD0nY9EIs7kXSQSsTp16jjtWrVqZbLXxIHOq8/P888/76QgGzVqlDMujUnfAk3+6O8ff/zh2Oh1Mps+p7/++qutWrXK9FqfXx1b7pqE6bVlEkh910TGeeed53wm9BlSv6688kpn/P369bNx48Y5EzDa9/PPP3cmdrQCWRMX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	arun1601for@gmail.com	Arun Kumar	\N	\N	f0fdc3b7-dd0d-4d22-9ba3-db81214f6a14	2026-01-23 05:25:50.706	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	\N	2026-01-23 04:43:01.698	2026-01-23 06:44:22.079	0	\N	2026-01-23 06:44:22.078	9	3	\N	0	
\.


--
-- Data for Name: QuotationActivity; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."QuotationActivity" (id, "quotationId", type, "ipAddress", "userAgent", location, "deviceType", browser, os, metadata, "createdAt") FROM stdin;
3bdaf6d5-1f5c-49d9-964b-fe8d97318459	44986153-22fb-4010-a0e4-a8c3ccb97f6b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	Desktop	Browser	\N	\N	2026-01-23 05:24:25.536
43e645a1-9e65-4195-a8fe-92b35d65afc2	44986153-22fb-4010-a0e4-a8c3ccb97f6b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	Desktop	Browser	\N	\N	2026-01-23 05:24:25.56
c13340b5-b95a-44f6-8734-aff1e7f34e1a	44986153-22fb-4010-a0e4-a8c3ccb97f6b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	Desktop	Browser	\N	\N	2026-01-23 05:24:58.693
6b1f0d81-6ab3-4a23-9146-43620e1a9665	44986153-22fb-4010-a0e4-a8c3ccb97f6b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	Desktop	Browser	\N	\N	2026-01-23 05:29:19.478
27de5490-ed65-4815-b6ed-b8a38f4ef502	44986153-22fb-4010-a0e4-a8c3ccb97f6b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	Desktop	Browser	\N	\N	2026-01-23 05:29:19.502
00944332-e663-4c32-a2a3-825d1af35279	44986153-22fb-4010-a0e4-a8c3ccb97f6b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	Desktop	Browser	\N	\N	2026-01-23 05:29:49.865
d0e0e31e-9d81-4a0b-bf61-2415705ffba1	44986153-22fb-4010-a0e4-a8c3ccb97f6b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	Desktop	Browser	\N	\N	2026-01-23 05:29:49.901
6465c991-2c08-4fbd-a793-da1d36e7503c	44986153-22fb-4010-a0e4-a8c3ccb97f6b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	Desktop	Browser	\N	\N	2026-01-23 06:44:22.016
a1209513-17cd-47f2-b39e-2134e7f0eea5	44986153-22fb-4010-a0e4-a8c3ccb97f6b	VIEWED	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	\N	Desktop	Browser	\N	\N	2026-01-23 06:44:22.088
\.


--
-- Data for Name: QuotationItem; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."QuotationItem" (id, "quotationId", description, quantity, "unitPrice", tax, discount, total) FROM stdin;
fb0d9258-ce96-4084-9117-7d2a52ada962	44986153-22fb-4010-a0e4-a8c3ccb97f6b	Website Development (React.js + Spring Boot)	1.00	60000.00	18.00	0.00	60000.00
e9ec96b1-3943-4d64-89bc-e8c7c3a2762c	44986153-22fb-4010-a0e4-a8c3ccb97f6b	Mobile App Development (React Native)	1.00	60000.00	18.00	0.00	60000.00
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Role" (id, name, description, "isSystem", "createdAt", "updatedAt") FROM stdin;
2efe4dac-9b40-4436-b299-badda6396405	HR	Human Resources Manager	f	2026-01-23 04:26:48.717	2026-01-23 04:26:48.717
2af33051-91e2-49b0-be8e-e879b80dc41c	Employee	Regular Employee	f	2026-01-23 04:26:48.771	2026-01-23 04:26:48.771
fbd2165d-3336-49b8-9b1f-188fbcd27b25	Admin	Full system access	t	2026-01-23 04:26:48.646	2026-01-23 10:19:25.394
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
112b1e35-5b2f-41a0-bb81-c0d58faab0e2	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.774	none	none	Dashboard	all	none
57d2a774-3b0f-4b76-9840-e3dbda564181	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.777	all	owned	Leave	owned	owned
bcef6c21-f6f2-4dce-916f-2812af9e0ac4	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.781	owned	none	Document	owned	owned
56548429-b207-434e-a8db-72a27dea3321	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.784	none	none	Employee	all	none
8fbfb740-4744-4b40-b456-3a3965854bb0	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.786	all	owned	Attendance	owned	owned
79533593-9bcc-45d0-b57b-49be973785c4	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.789	none	none	LeaveType	all	none
152523eb-986b-45fc-bb9c-43996f752a24	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.791	none	none	LeaveBalance	owned	owned
d403fd9c-3222-4328-bcb9-f58f1bd1d680	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.795	none	none	Shift	all	none
5f73c571-b970-40f4-8eed-d695add9b974	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.799	none	none	ShiftRoster	owned	none
07360b8b-c175-4a6f-ae66-a985b4b31b0d	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.801	none	none	Holiday	all	none
44e8982b-fe9b-4545-855a-3ff2db50c87d	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.804	none	none	Department	all	none
7bbaa061-e58e-49b6-9917-f20e53abe9e6	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.806	none	none	Position	all	none
b0f125e1-ccf7-4665-bbd0-2406045ae396	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.651	all	all	Dashboard	all	all
65fd3096-864c-42ba-af72-b3c23216db5f	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.656	all	all	Company	all	all
a06e9ec1-2291-499c-89a5-6e21471d8f9b	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.659	all	all	User	all	all
a92c48b7-8b71-4f25-90b1-abf86db85a1c	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.661	all	all	Role	all	all
df8bdaf2-0a9f-417b-871f-83a5cd788a2f	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.664	all	all	Client	all	all
1ec61b09-0e88-47ce-a0b1-d3c4da29a0e0	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.666	all	all	Lead	all	all
1bfc5900-d3a5-4f67-b332-7ac0553f0e68	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.668	all	all	LeadActivity	all	all
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
0210f98e-0101-4168-88fe-cd6a6968bded	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.689	all	all	LeaveType	all	all
879fd206-b861-45e1-b8c5-0d16329d3e27	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.691	all	all	LeaveBalance	all	all
83e00d2f-9fd3-4e45-9b8c-b2f8eb505c84	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.694	all	all	Shift	all	all
7c6b5381-3a36-4cb6-88e2-2e9700b39ce3	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.696	all	all	ShiftRoster	all	all
73e0553b-dbbe-4131-a613-711de05875b5	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.698	all	all	Payroll	all	all
f8ad2102-5b14-46b7-b993-6d31f1096761	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.7	all	all	Asset	all	all
df07b86e-36c6-45dc-b5ab-b077d3e2551a	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.703	all	all	Recruitment	all	all
c0aed786-2a77-4906-8216-cc4a111d02b3	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.707	all	all	Document	all	all
c68bd51a-403f-4560-b0e9-e2956ec73b05	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.71	all	all	Holiday	all	all
48be23a6-0f9f-4019-995f-9436744873c1	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 10:19:25.477	all	all	Contract	all	all
\.


--
-- Data for Name: SalaryComponent; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."SalaryComponent" (id, "companyId", name, type, "calculationType", "defaultValue", "isActive", "createdAt", "updatedAt") FROM stdin;
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
\.


--
-- Data for Name: ShiftRoster; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ShiftRoster" (id, "employeeId", "shiftId", date, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Subscription" (id, "companyId", "clientId", name, plan, amount, "billingCycle", "startDate", "endDate", status, "nextBillingDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Task" (id, "projectId", title, description, status, priority, "dueDate", "createdById", "assignedToId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Timesheet; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Timesheet" (id, "companyId", "projectId", "employeeId", date, hours, "isBillable", description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Transaction" (id, "accountId", date, type, amount, description, reference, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."User" (id, email, password, "firstName", "lastName", phone, "isActive", "lastLogin", "createdAt", "updatedAt", "resetToken", "resetTokenExpiry", "companyId") FROM stdin;
b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	admin@applizor.com	$2a$10$DpWhIvmPTMQL0LOm7NOmF.OXI2rlSSQHtgaXN6AYgP8pJ8MCXCucK	Admin	User	\N	t	2026-01-26 07:28:42.325	2026-01-23 04:26:48.968	2026-01-26 07:28:42.326	\N	\N	b81a0e3f-9301-43f7-a633-6db7e5fa54b0
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."UserRole" (id, "userId", "roleId", "createdAt") FROM stdin;
6885b1cd-53be-49a8-a807-0a1090128892	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.977
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
\.


--
-- Data for Name: quotation_templates; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public.quotation_templates (id, "companyId", name, description, category, title, "templateDescription", "paymentTerms", "deliveryTerms", notes, items, "isActive", "usageCount", "createdBy", "createdAt", "updatedAt") FROM stdin;
44abfa8c-0c9f-4a97-bf23-aa18e055bd7e	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	News website and video streaming app quotation	\N	News Website and Streaming App	News website and video streaming app quotation	<p>Applizor Softech LLP is pleased to present this proposal for developing a fully functional, self-hosted video news platform for Peptech Time. This platform will include a feature-rich website and mobile apps for Android, iOS, and Android TV.</p><p>Our focus is to deliver a seamless experience where users can read news articles and stream news videos — with complete control over content and monetization.</p><h4><strong>Project Timeline</strong></h4><p>Website Development 4–5 Weeks</p><p>Android &amp; iOS App 2–3 Weeks</p><p>Android TV App 1–2 Weeks</p><p><br></p><p><strong>Website Development (React.js + Spring Boot)</strong></p><p>Infrastructure Setup</p><p>VPS/Cloud hosting setup (DigitalOcean/Linode)</p><p>CDN configuration (Cloudflare)</p><p>Media storage integration (Amazon S3 or Wasabi)</p><p>Platform Setup</p><p>React.js frontend with SEO support</p><p>Spring Boot backend with REST APIs</p><p>Admin dashboard for managing reporters, news, and media</p><p>News &amp; Video Content</p><p>Post multilingual news articles (Hindi, English, Hinglish)</p><p>Upload self-hosted videos via admin panel</p><p>Use custom HLS video player (Video.js or Shaka Player)</p><p>Live streaming setup using RTMP + HLS</p><p>Reporter System</p><p>Create reporter login system</p><p>Reporters can post text + video-based news</p><p>Approval system by admin before publish</p><p>User Engagement &amp; Monetization</p><p>Push notification integration</p><p>Social sharing (WhatsApp, Telegram)</p><p>Donation support via Razorpay/Instamojo</p><p>Video ads (VAST tag support)</p><p>Option to add affiliate links and banners</p><p>Security &amp; Performance</p><p>JWT authentication</p><p>SSL certificate, secure API practices</p><p>Caching, image compression, lazy loading</p><p>Regular backups and system monitoring</p><p><br></p><p><strong>Mobile App Development (React Native)</strong></p><p>for Android, iOS &amp; Android TV – single codebase using React Native)</p><p>Platforms</p><p>Android Phone/Tablet App iOS App</p><p>Android TV App (custom layout and controls)</p><p>Core Features</p><p>Stream videos using HLS format</p><p>News article viewer with multilingual support</p><p>Push notifications for breaking news</p><p>User login and donation integration</p><p>Offline download support (optional)</p><p>Chromecast &amp; Android TV playback support</p><p>Security &amp; Optimization</p><p>Encrypted API communication</p><p>Optimized UI/UX for speed and responsiveness</p><p>Play Store &amp; App Store compliance</p><p>Scalability</p><p>Support for future features like:</p><p>AI-based subtitles</p><p>Scheduled publishing</p><p>Personalized content suggestions</p>	<p>Payment due within 30 days. 50% Advance to start work.</p>	<p>Delivery via Email/Cloud Link.</p>	<p>This quotation is valid for 15 days.</p>	[{"tax": 18, "discount": 0, "quantity": 1, "unitPrice": 60000, "description": "Website Development (React.js + Spring Boot)"}, {"tax": 18, "discount": 0, "quantity": 1, "unitPrice": 60000, "description": "Mobile App Development (React Native)"}]	t	2	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-23 04:42:23.824	2026-01-26 07:33:28.821
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
-- Name: Position Position_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_pkey" PRIMARY KEY (id);


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
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


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
-- Name: DocumentTemplate_type_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "DocumentTemplate_type_idx" ON public."DocumentTemplate" USING btree (type);


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
-- Name: InvoiceItem_invoiceId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "InvoiceItem_invoiceId_idx" ON public."InvoiceItem" USING btree ("invoiceId");


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
-- Name: Position_departmentId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Position_departmentId_idx" ON public."Position" USING btree ("departmentId");


--
-- Name: Position_departmentId_title_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Position_departmentId_title_key" ON public."Position" USING btree ("departmentId", title);


--
-- Name: Project_clientId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Project_clientId_idx" ON public."Project" USING btree ("clientId");


--
-- Name: Project_companyId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Project_companyId_idx" ON public."Project" USING btree ("companyId");


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
-- Name: QuotationItem_quotationId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "QuotationItem_quotationId_idx" ON public."QuotationItem" USING btree ("quotationId");


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
-- Name: Task_assignedToId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_assignedToId_idx" ON public."Task" USING btree ("assignedToId");


--
-- Name: Task_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_projectId_idx" ON public."Task" USING btree ("projectId");


--
-- Name: Task_status_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_status_idx" ON public."Task" USING btree (status);


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
-- Name: Timesheet_employeeId_projectId_date_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "Timesheet_employeeId_projectId_date_key" ON public."Timesheet" USING btree ("employeeId", "projectId", date);


--
-- Name: Timesheet_projectId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Timesheet_projectId_idx" ON public."Timesheet" USING btree ("projectId");


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
-- Name: Client Client_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: InvoiceItem InvoiceItem_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: Position Position_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: QuotationItem QuotationItem_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public."Quotation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quotation Quotation_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: Task Task_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Task Task_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: Transaction Transaction_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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

\unrestrict Txfifcc0vqlEXOh5pcOX1ljHZTHYPITOdeYdFeqmVduumDmin4EqAtMgs2waS3n

