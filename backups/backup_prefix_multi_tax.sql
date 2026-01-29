--
-- PostgreSQL database dump
--

\restrict fY6aWZsFde52CiykADerBmkh8s3a7RevpV13OWBVTPgMwP4jMaapyjUKckXqf53

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
    currency text DEFAULT 'INR'::text NOT NULL
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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "taskId" text
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
    "recurringStatus" text DEFAULT 'active'::text NOT NULL
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
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "taxRateId" text,
    unit text
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
    currency text DEFAULT 'INR'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "actualExpenses" numeric(12,2),
    "actualRevenue" numeric(12,2),
    currency text DEFAULT 'INR'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    settings jsonb,
    tags text[] DEFAULT ARRAY[]::text[]
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
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    unit text
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
    "createdClientId" text,
    "milestoneId" text,
    tags text[] DEFAULT ARRAY[]::text[],
    type text DEFAULT 'task'::text NOT NULL,
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
    "clientId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
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
    "taskId" text
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
    "startTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
9f1615a0-9df2-4d69-97ec-246ded0ad290	127734dd-b6ad-4b57-bcc0-a310e3389393	2026-01-28	2026-01-28 14:54:48.798	\N	present	::ffff:192.168.65.1	\N	\N	2026-01-28 14:54:48.799	2026-01-28 14:54:48.799
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."AuditLog" (id, "companyId", "userId", action, module, "entityType", "entityId", details, changes, "ipAddress", "userAgent", "createdAt") FROM stdin;
d3226c21-2172-4b0e-8971-29c589998784	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-28 18:23:17.841
c4efa67a-07c3-4fce-b3c0-fab3296eb961	\N	\N	LOGIN	AUTH	User	ebe173c1-9846-47db-a65d-b4cd3e99fdce	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-28 19:13:12.725
b6102b83-bbaa-4996-8398-287020bfbe4e	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-28 19:21:55.569
e7127ae4-e072-480c-adf9-57840390426d	\N	\N	LOGIN	AUTH	User	ebe173c1-9846-47db-a65d-b4cd3e99fdce	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-28 19:45:30.201
6dbd20cf-189e-497e-aa24-de1a31609b57	\N	\N	LOGIN	AUTH	User	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-28 19:57:28.67
72011efa-99c3-44a6-a823-40211c2350c6	\N	\N	LOGIN	AUTH	User	ebe173c1-9846-47db-a65d-b4cd3e99fdce	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-28 19:57:32.631
714716b2-8220-40a5-8b45-62853fc1212e	\N	\N	LOGIN	AUTH	User	048f58f4-ebc0-4501-841b-d534fd6dc217	User logged in successfully	\N	::ffff:192.168.65.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-29 04:49:17.653
\.


--
-- Data for Name: AutomationRule; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."AutomationRule" (id, "projectId", name, "triggerType", "triggerConfig", "actionType", "actionConfig", "isActive", "createdAt", "updatedAt") FROM stdin;
8f934bb0-ae4f-4750-b027-48d256c3fb86	faabb466-efd3-41c0-8f36-df9cf6a43d5e	Global task create email notification	TASK_CREATED	{"to": "done", "from": "*"}	SEND_EMAIL	{"body": "", "subject": "", "recipient": "custom", "customEmail": "info@applizor.com", "useTemplate": "mention"}	t	2026-01-29 07:53:40.902	2026-01-29 07:53:40.902
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

COPY public."Client" (id, "companyId", name, email, phone, address, city, state, country, pincode, gstin, pan, status, "clientType", "createdAt", "updatedAt", password, "portalAccess", "lastLogin", "createdById", notes, "shippingAddress", "taxName", website, "categoryId", "companyLogo", gender, language, mobile, "profilePicture", "receiveNotifications", salutation, "subCategoryId", "companyName", currency) FROM stdin;
62d06bdc-6589-477d-918f-7fc3b66534ea	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Varun Kumar	arun1601for@gmail.com		OM SAI VARADVISHWA	PUNE	Maharashtra	India	411057		\N	active	customer	2026-01-28 14:33:02.611	2026-01-29 07:44:01.132	$2a$10$6skbaDvT.mNlre2NrlF/9eEYA1YOULcq.0kGj3IKCTmFsUWN1uDAu	t	2026-01-29 07:44:01.131	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9			ACCCC	https://itlabspeed.com/	015140de-2d11-4dfe-a2a6-7f2c67f50429	/uploads/logos/image-1769610961697-278532653.png	male	English	9226889662	/uploads/profiles/profile-1769610940219-482992722.png	t	Mr.	\N	itlabspeed	INR
\.


--
-- Data for Name: ClientCategory; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ClientCategory" (id, "companyId", name, "createdAt", "updatedAt") FROM stdin;
015140de-2d11-4dfe-a2a6-7f2c67f50429	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	health	2026-01-28 14:33:35.909	2026-01-28 14:33:35.909
\.


--
-- Data for Name: ClientSubCategory; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ClientSubCategory" (id, "categoryId", name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Company" (id, name, "legalName", email, phone, address, city, state, country, pincode, gstin, pan, logo, "letterheadDoc", "allowedIPs", latitude, longitude, radius, "isActive", "enabledModules", "createdAt", "updatedAt", currency, tan, "continuationSheet", "digitalSignature", letterhead, "pdfContinuationTop", "pdfMarginBottom", "pdfMarginLeft", "pdfMarginRight", "pdfMarginTop") FROM stdin;
b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Applizor Softech LLP	Applizor Softech LLP	connect@applizor.com	9130309480	209, WARD NO 7, VISHWAKARMA MUHALLA, GARROLI	Chhatarpur	Madhya Pradesh	India	471201	27AAAAA0000A1Z5	\N	/uploads/logos/logo-1769142517693-126258508.png	\N	\N	\N	\N	100	t	null	2026-01-23 04:26:48.633	2026-01-29 14:22:23.047	INR	\N	/uploads/letterheads/continuationSheet-1769610392047-861597632.pdf	/uploads/signatures/signature-1769610326150-935582894.png	/uploads/letterheads/letterhead-1769610387854-975815796.PDF	80	80	40	40	180
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

COPY public."Document" (id, "companyId", "clientId", "invoiceId", "employeeId", "projectId", name, type, category, "filePath", "fileSize", "mimeType", version, "isTemplate", tags, metadata, "createdAt", "updatedAt", "taskId") FROM stdin;
b5b402e4-7850-42c2-8a5d-95ac3fd5a4a4	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	62d06bdc-6589-477d-918f-7fc3b66534ea	\N	\N	faabb466-efd3-41c0-8f36-df9cf6a43d5e	HRMS_DB_Diagram.png	task_attachment	\N	uploads/1769616675127-296651101.png	5993	image/png	1	f	\N	\N	2026-01-28 16:11:15.163	2026-01-28 16:11:15.163	b4bb8bbd-2cdc-40c9-8259-505a2db18b6c
abaf4b62-8397-4822-8138-53debc5760a5	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	62d06bdc-6589-477d-918f-7fc3b66534ea	\N	\N	faabb466-efd3-41c0-8f36-df9cf6a43d5e	1768395599126_labreportnew (2).pdf	task_attachment	\N	uploads/1769667850658-751994523.pdf	641024	application/pdf	1	f	\N	\N	2026-01-29 06:24:10.713	2026-01-29 06:24:10.713	d67e3b8c-db2a-44dc-88c4-906a14d5ef68
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
127734dd-b6ad-4b57-bcc0-a310e3389393	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	ebe173c1-9846-47db-a65d-b4cd3e99fdce	EMP-0001	employee1	one	applizor1@gmail.com		Male	\N	\N	\N	2026-01-01 00:00:00			\N						a9e50298-d5db-4b87-8ab6-a8e12194321d	020858a5-3766-4388-99cb-39f9af2c2879	\N	\N	\N	active	2026-01-28 14:23:00.529	2026-01-28 14:23:00.529	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	Full Time	\N	\N	\N	\N	\N	\N	f
582bbcd1-2f89-465a-88eb-b454a1dae1cc	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	048f58f4-ebc0-4501-841b-d534fd6dc217	EMP-0002	employee2	two	sapplizor@gmail.com		\N	\N	\N	\N	2026-01-01 00:00:00			\N						a9e50298-d5db-4b87-8ab6-a8e12194321d	020858a5-3766-4388-99cb-39f9af2c2879	\N	\N	\N	active	2026-01-28 14:23:31.802	2026-01-28 14:23:31.802	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	Full Time	\N	\N	\N	\N	\N	\N	f
\.


--
-- Data for Name: EmployeeLeaveBalance; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmployeeLeaveBalance" (id, "employeeId", "leaveTypeId", year, allocated, "carriedOver", used, "createdAt", "updatedAt") FROM stdin;
465d4530-27d7-4bc2-a0fc-3aeff09943b7	127734dd-b6ad-4b57-bcc0-a310e3389393	c01b69ee-83c0-482d-af93-ad1690bc371d	2026	4	0	0	2026-01-28 14:23:00.537	2026-01-28 14:23:00.537
7815d00e-be16-4cbf-a42f-643aa3d8e6e0	127734dd-b6ad-4b57-bcc0-a310e3389393	6e2652ac-a743-42eb-a56f-561af5f05646	2026	4	0	0	2026-01-28 14:23:00.537	2026-01-28 14:23:00.537
f996298f-14f5-4409-9028-064acd316938	127734dd-b6ad-4b57-bcc0-a310e3389393	9d6bebad-72ef-43c9-96e1-afa64c1616ef	2026	0	0	0	2026-01-28 14:23:00.537	2026-01-28 14:23:00.537
69ccef49-1e12-4387-8c70-10f7f01d3459	582bbcd1-2f89-465a-88eb-b454a1dae1cc	c01b69ee-83c0-482d-af93-ad1690bc371d	2026	4	0	0	2026-01-28 14:23:31.812	2026-01-28 14:23:31.812
43faabab-12ac-4a94-92de-1fffe683651b	582bbcd1-2f89-465a-88eb-b454a1dae1cc	6e2652ac-a743-42eb-a56f-561af5f05646	2026	4	0	0	2026-01-28 14:23:31.812	2026-01-28 14:23:31.812
a5f1b0f2-74a0-4d19-91ac-daf71cff28f3	582bbcd1-2f89-465a-88eb-b454a1dae1cc	9d6bebad-72ef-43c9-96e1-afa64c1616ef	2026	0	0	0	2026-01-28 14:23:31.812	2026-01-28 14:23:31.812
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
c40fdf60-35c8-43c2-8993-20ede3c29535	Republic Day	2026-01-26	national	t	2026-01-28 14:21:27.847	2026-01-28 14:21:27.847
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

COPY public."Invoice" (id, "companyId", "clientId", "invoiceNumber", "invoiceDate", "dueDate", status, type, currency, terms, subtotal, tax, discount, total, "paidAmount", "isRecurring", "recurringId", notes, "pdfPath", "createdAt", "updatedAt", "nextOccurrence", "projectId", "recurringInterval", "recurringEndDate", "recurringNextRun", "recurringStartDate", "recurringStatus") FROM stdin;
\.


--
-- Data for Name: InvoiceItem; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."InvoiceItem" (id, "invoiceId", description, "hsnCode", quantity, rate, "taxRate", amount, "createdAt", "taxRateId", unit) FROM stdin;
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

COPY public."Lead" (id, "companyId", name, email, phone, company, source, status, stage, value, notes, "assignedTo", "createdAt", "updatedAt", "assignedAt", "convertedAt", "convertedToClientId", "createdBy", industry, "jobTitle", "lastContactedAt", "nextFollowUpAt", priority, probability, "sourceDetails", tags, website, currency) FROM stdin;
dbdc790d-fbc9-477a-8a64-0f9116905d6d	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Varun Kumar	arun1601for@gmail.com		itlabspeed	website	won	closed	\N		b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-28 14:32:37.79	2026-01-28 14:33:02.623	\N	2026-01-28 14:33:02.621	62d06bdc-6589-477d-918f-7fc3b66534ea	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9			\N	\N	medium	0		{}	https://itlabspeed.com/	INR
\.


--
-- Data for Name: LeadActivity; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."LeadActivity" (id, "leadId", type, title, description, outcome, "scheduledAt", "completedAt", "dueDate", "reminderSent", "reminderTime", "assignedTo", "createdBy", status, "createdAt", "updatedAt") FROM stdin;
20faeddd-aeb8-4d28-82a6-7924306f2e2d	dbdc790d-fbc9-477a-8a64-0f9116905d6d	status_change	Stage changed to qualified	\N	\N	\N	\N	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	pending	2026-01-28 14:32:49.613	2026-01-28 14:32:49.613
c62ebf1a-27db-4b91-a5af-dac31c27050d	dbdc790d-fbc9-477a-8a64-0f9116905d6d	conversion	Lead converted to client	Client ID: 62d06bdc-6589-477d-918f-7fc3b66534ea	\N	\N	\N	\N	f	\N	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	pending	2026-01-28 14:33:02.627	2026-01-28 14:33:02.627
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

COPY public."Milestone" (id, "projectId", title, description, "dueDate", amount, currency, status, "order", "createdAt", "updatedAt") FROM stdin;
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

COPY public."Project" (id, "companyId", "clientId", name, description, status, "startDate", "endDate", budget, "isBillable", "createdAt", "updatedAt", "actualExpenses", "actualRevenue", currency, priority, settings, tags) FROM stdin;
faabb466-efd3-41c0-8f36-df9cf6a43d5e	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	62d06bdc-6589-477d-918f-7fc3b66534ea	itlabspeed	AI base laboratory management system	active	2026-01-28 00:00:00	\N	\N	t	2026-01-28 14:49:25.558	2026-01-28 19:47:04.819	\N	\N	INR	medium	{"permissions": {"member": {"tasks": {"edit": true, "view": true, "create": true, "delete": false}, "settings": {"edit": false, "view": false}, "financials": {"edit": false, "view": false, "create": false, "delete": false}, "milestones": {"edit": false, "view": true, "create": false, "delete": false}}, "viewer": {"tasks": {"edit": false, "view": true, "create": false, "delete": false}, "settings": {"edit": false, "view": false}, "financials": {"edit": false, "view": false, "create": false, "delete": false}, "milestones": {"edit": false, "view": true, "create": false, "delete": false}}}, "notificationEmail": "info@applizor.com"}	{}
\.


--
-- Data for Name: ProjectMember; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ProjectMember" (id, "projectId", "employeeId", role, "joinedAt") FROM stdin;
70bc7582-342c-4e46-b7e0-002154d5eca1	faabb466-efd3-41c0-8f36-df9cf6a43d5e	127734dd-b6ad-4b57-bcc0-a310e3389393	member	2026-01-28 14:49:45.762
14159c56-d62f-4302-ab89-f657560e1568	faabb466-efd3-41c0-8f36-df9cf6a43d5e	582bbcd1-2f89-465a-88eb-b454a1dae1cc	member	2026-01-28 14:49:48.231
\.


--
-- Data for Name: ProjectNote; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ProjectNote" (id, "projectId", title, content, "isPinned", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Quotation; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Quotation" (id, "companyId", "leadId", "clientId", "quotationNumber", title, description, "quotationDate", "validUntil", status, subtotal, tax, discount, total, currency, "paymentTerms", "deliveryTerms", notes, "pdfPath", "templateId", "publicToken", "publicExpiresAt", "isPublicEnabled", "clientViewedAt", "clientAcceptedAt", "clientRejectedAt", "clientSignature", "clientEmail", "clientName", "clientComments", "signedPdfPath", "convertedToInvoiceId", "convertedAt", "createdBy", "assignedTo", "createdAt", "updatedAt", "emailOpens", "lastEmailOpenedAt", "lastViewedAt", "viewCount", "maxReminders", "nextReminderAt", "reminderCount", "reminderFrequency") FROM stdin;
\.


--
-- Data for Name: QuotationActivity; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."QuotationActivity" (id, "quotationId", type, "ipAddress", "userAgent", location, "deviceType", browser, os, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: QuotationItem; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."QuotationItem" (id, "quotationId", description, quantity, "unitPrice", tax, discount, total, "taxRateId", unit) FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Role" (id, name, description, "isSystem", "createdAt", "updatedAt") FROM stdin;
2efe4dac-9b40-4436-b299-badda6396405	HR	Human Resources Manager	f	2026-01-23 04:26:48.717	2026-01-23 04:26:48.717
fbd2165d-3336-49b8-9b1f-188fbcd27b25	Admin	Full system access	t	2026-01-23 04:26:48.646	2026-01-28 14:24:06.507
2af33051-91e2-49b0-be8e-e879b80dc41c	Employee	Regular Employee	f	2026-01-23 04:26:48.771	2026-01-28 20:02:47.017
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
f1eec685-2277-4cbc-91b2-55c91dd88679	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-28 14:24:06.619	all	all	Project	all	all
aa274c19-2ca7-4e7b-b213-48c81f4f704a	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-28 14:24:06.624	all	all	ProjectTask	all	all
c68bd51a-403f-4560-b0e9-e2956ec73b05	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.71	all	all	Holiday	all	all
5c03d140-73d1-4b29-8cbd-42a341a1b7f5	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-28 14:24:06.631	all	all	Contract	all	all
44e8982b-fe9b-4545-855a-3ff2db50c87d	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.804	none	none	Department	all	none
7bbaa061-e58e-49b6-9917-f20e53abe9e6	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.806	none	none	Position	all	none
56548429-b207-434e-a8db-72a27dea3321	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.784	none	none	Employee	owned	none
8fbfb740-4744-4b40-b456-3a3965854bb0	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.786	all	owned	Attendance	owned	owned
57d2a774-3b0f-4b76-9840-e3dbda564181	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.777	all	owned	Leave	owned	owned
79533593-9bcc-45d0-b57b-49be973785c4	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.789	none	none	LeaveType	all	none
d403fd9c-3222-4328-bcb9-f58f1bd1d680	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.795	none	none	Shift	all	none
5f73c571-b970-40f4-8eed-d695add9b974	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.799	none	none	ShiftRoster	owned	none
bcef6c21-f6f2-4dce-916f-2812af9e0ac4	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.781	all	none	Document	added_owned	added_owned
07360b8b-c175-4a6f-ae66-a985b4b31b0d	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.801	none	none	Holiday	all	none
8329774a-2c11-4866-b508-90febfd042f0	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.29	none	none	Company	none	none
6cadef4e-d22c-435c-bda4-989f0ca10012	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.293	none	none	User	none	none
5491b8b4-687d-433e-ba18-b40a3c3abb98	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.298	none	none	Role	none	none
465593a9-c2d5-4269-b14a-12fb8572296e	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-28 18:25:05.941	all	all	Timesheet	all	all
3730e6ed-ef40-435b-8e13-47ee0c54dd39	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.369	none	none	Project	owned	none
13e71626-023b-4ea2-94c3-6c87e8098ce8	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.371	all	none	ProjectTask	added_owned	added_owned
8af3d459-94b5-49a3-977b-08ace50c2ad9	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 19:14:26.198	all	none	Timesheet	added_owned	added_owned
297eae20-cf8e-4298-a780-2b686e0daf7b	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.377	none	none	Contract	none	none
112b1e35-5b2f-41a0-bb81-c0d58faab0e2	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.774	none	none	Dashboard	all	none
72bd71dc-af7b-4b61-8bc2-eba3ebeb876a	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.301	none	none	Client	none	none
4b7f6b00-50bd-4788-99ed-03bc22e86f99	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.305	none	none	Lead	none	none
9718a89f-b693-429c-9956-ff8c47dcd081	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.308	none	none	LeadActivity	none	none
b7d31043-89b5-4fe5-a9a3-e47cf9d4ab83	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.312	none	none	Quotation	none	none
a3f519c5-8e32-4abd-9b75-982d0131cbb0	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.315	none	none	QuotationTemplate	none	none
823da36d-b6ce-4cbd-b95c-208ccf988a2f	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.318	none	none	Invoice	none	none
af572043-9bca-4559-8206-e7a4142de88c	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.321	none	none	Payment	none	none
38b7bda8-21fe-410c-b914-bc9ad9aafaee	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.323	none	none	Subscription	none	none
152523eb-986b-45fc-bb9c-43996f752a24	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.791	none	none	LeaveBalance	owned	owned
981d8023-f787-4ee3-b84d-ab1359f56c5e	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.356	none	none	Payroll	none	none
81fe446b-8b6a-4c9f-85b5-2539572019c8	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.358	none	none	Asset	none	none
87cd9ab7-f973-47b3-9304-d18b2062ceb8	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:25:02.362	none	none	Recruitment	none	none
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
0f5309b2-b025-4c39-862e-ecf84645587f	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	General Shift	10:00	19:00	60	t	2026-01-28 14:21:50.098	2026-01-28 14:21:50.098	["monday", "tuesday", "wednesday", "thursday", "friday"]
\.


--
-- Data for Name: ShiftRoster; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ShiftRoster" (id, "employeeId", "shiftId", date, "createdAt", "updatedAt") FROM stdin;
a9fdd0e8-3915-4eac-992c-2774b847ac52	582bbcd1-2f89-465a-88eb-b454a1dae1cc	0f5309b2-b025-4c39-862e-ecf84645587f	2026-01-27	2026-01-28 14:31:03.15	2026-01-28 14:31:03.15
a7928f41-05bf-44fe-8dfe-3f5c6e3d4d59	127734dd-b6ad-4b57-bcc0-a310e3389393	0f5309b2-b025-4c39-862e-ecf84645587f	2026-01-27	2026-01-28 14:31:03.15	2026-01-28 14:31:03.15
d628028a-b154-474c-b4a7-b8d083f4666c	582bbcd1-2f89-465a-88eb-b454a1dae1cc	0f5309b2-b025-4c39-862e-ecf84645587f	2026-01-28	2026-01-28 14:31:03.15	2026-01-28 14:31:03.15
c6044f47-448a-4274-9bc7-6845531c31d0	127734dd-b6ad-4b57-bcc0-a310e3389393	0f5309b2-b025-4c39-862e-ecf84645587f	2026-01-28	2026-01-28 14:31:03.15	2026-01-28 14:31:03.15
2358f631-34bc-418e-8b16-0ba168cadc67	582bbcd1-2f89-465a-88eb-b454a1dae1cc	0f5309b2-b025-4c39-862e-ecf84645587f	2026-01-29	2026-01-28 14:31:03.15	2026-01-28 14:31:03.15
eec5aef9-dc4f-46ad-9856-dc4376f5b316	127734dd-b6ad-4b57-bcc0-a310e3389393	0f5309b2-b025-4c39-862e-ecf84645587f	2026-01-29	2026-01-28 14:31:03.15	2026-01-28 14:31:03.15
d68ea551-c730-4556-8f61-08f177ad3c41	582bbcd1-2f89-465a-88eb-b454a1dae1cc	0f5309b2-b025-4c39-862e-ecf84645587f	2026-01-30	2026-01-28 14:31:03.15	2026-01-28 14:31:03.15
ab39b09c-35d9-4d09-886d-76b4d2abe781	127734dd-b6ad-4b57-bcc0-a310e3389393	0f5309b2-b025-4c39-862e-ecf84645587f	2026-01-30	2026-01-28 14:31:03.15	2026-01-28 14:31:03.15
a0d22830-6bab-4ede-8617-3f60630baabf	582bbcd1-2f89-465a-88eb-b454a1dae1cc	0f5309b2-b025-4c39-862e-ecf84645587f	2026-02-02	2026-01-28 14:31:16.637	2026-01-28 14:31:16.637
cab15bfb-4959-464b-aec0-538d2fe2dab4	127734dd-b6ad-4b57-bcc0-a310e3389393	0f5309b2-b025-4c39-862e-ecf84645587f	2026-02-02	2026-01-28 14:31:16.637	2026-01-28 14:31:16.637
f62768c0-9abe-4aed-9e1d-bc01e39608f7	582bbcd1-2f89-465a-88eb-b454a1dae1cc	0f5309b2-b025-4c39-862e-ecf84645587f	2026-02-03	2026-01-28 14:31:16.637	2026-01-28 14:31:16.637
7d53ca0a-757b-4f0e-affb-fb90d0ed1e71	127734dd-b6ad-4b57-bcc0-a310e3389393	0f5309b2-b025-4c39-862e-ecf84645587f	2026-02-03	2026-01-28 14:31:16.637	2026-01-28 14:31:16.637
60b2ffc0-2071-4c26-9ac7-cf0a3c6d66b9	582bbcd1-2f89-465a-88eb-b454a1dae1cc	0f5309b2-b025-4c39-862e-ecf84645587f	2026-02-04	2026-01-28 14:31:16.637	2026-01-28 14:31:16.637
76b648ff-abd0-4249-afa4-c1905c54051a	127734dd-b6ad-4b57-bcc0-a310e3389393	0f5309b2-b025-4c39-862e-ecf84645587f	2026-02-04	2026-01-28 14:31:16.637	2026-01-28 14:31:16.637
22baa2f1-cecf-4439-8862-a44996247bbf	582bbcd1-2f89-465a-88eb-b454a1dae1cc	0f5309b2-b025-4c39-862e-ecf84645587f	2026-02-05	2026-01-28 14:31:16.637	2026-01-28 14:31:16.637
3e209ca8-671b-4ab0-ba22-9e5acd76658d	127734dd-b6ad-4b57-bcc0-a310e3389393	0f5309b2-b025-4c39-862e-ecf84645587f	2026-02-05	2026-01-28 14:31:16.637	2026-01-28 14:31:16.637
3c4522eb-5a13-44b5-9f28-6fa5d1c4a443	582bbcd1-2f89-465a-88eb-b454a1dae1cc	0f5309b2-b025-4c39-862e-ecf84645587f	2026-02-06	2026-01-28 14:31:16.637	2026-01-28 14:31:16.637
45f694ca-51c4-4531-b78d-56a241a926c0	127734dd-b6ad-4b57-bcc0-a310e3389393	0f5309b2-b025-4c39-862e-ecf84645587f	2026-02-06	2026-01-28 14:31:16.637	2026-01-28 14:31:16.637
\.


--
-- Data for Name: Sprint; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Sprint" (id, "projectId", name, goal, "startDate", "endDate", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Subscription" (id, "companyId", "clientId", name, plan, amount, "billingCycle", "startDate", "endDate", status, "nextBillingDate", "createdAt", "updatedAt", currency) FROM stdin;
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Task" (id, "projectId", title, description, status, priority, "dueDate", "createdById", "assignedToId", "createdAt", "updatedAt", "createdClientId", "milestoneId", tags, type, "epicId", "parentId", "position", "sprintId", "startDate", "storyPoints") FROM stdin;
b4bb8bbd-2cdc-40c9-8259-505a2db18b6c	faabb466-efd3-41c0-8f36-df9cf6a43d5e	Please design this type of diagram	<p>please check attachment</p>	in-progress	medium	\N	\N	048f58f4-ebc0-4501-841b-d534fd6dc217	2026-01-28 16:11:15.143	2026-01-28 16:15:18.41	62d06bdc-6589-477d-918f-7fc3b66534ea	\N	{}	task	\N	\N	0	\N	\N	0
a9a0361e-8f9e-464c-b089-0f1272b77a9c	faabb466-efd3-41c0-8f36-df9cf6a43d5e	Create itlabspeed a logo for sidebar	<p><br></p>	in-progress	medium	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	ebe173c1-9846-47db-a65d-b4cd3e99fdce	2026-01-28 14:55:31.884	2026-01-29 06:39:14.243	\N	\N	{}	task	\N	\N	0	\N	\N	0
27c29fc3-ac5f-472c-abc7-3eef25911df5	faabb466-efd3-41c0-8f36-df9cf6a43d5e	testing notificaiton	<p>testing not</p>	todo	medium	\N	\N	\N	2026-01-29 06:44:16.921	2026-01-29 06:44:16.921	62d06bdc-6589-477d-918f-7fc3b66534ea	\N	{}	issue	\N	\N	0	\N	\N	0
1558e7c3-d1b0-4951-b307-245b59469aed	faabb466-efd3-41c0-8f36-df9cf6a43d5e	test notify 2	<p>test notify 2</p>	todo	medium	\N	\N	\N	2026-01-29 07:54:44.966	2026-01-29 07:54:44.966	62d06bdc-6589-477d-918f-7fc3b66534ea	\N	{}	issue	\N	\N	0	\N	\N	0
50ed01e2-d3ad-4e52-93e6-ab84c4404aef	faabb466-efd3-41c0-8f36-df9cf6a43d5e	need more option in booking page	<p>its not working in ios</p>	todo	high	\N	\N	\N	2026-01-29 04:53:46.748	2026-01-29 04:53:46.748	62d06bdc-6589-477d-918f-7fc3b66534ea	\N	{}	bug	\N	\N	0	\N	\N	0
d67e3b8c-db2a-44dc-88c4-906a14d5ef68	faabb466-efd3-41c0-8f36-df9cf6a43d5e	We need to create new pdf for CRL client . Attachment has been sent	<p data-prosemirror-content-type="node" data-prosemirror-node-name="paragraph" data-prosemirror-node-block="true" data-pm-slice="1 1 []">Tempalte name: crl.ts</p>	todo	medium	\N	\N	\N	2026-01-29 06:24:10.697	2026-01-29 06:24:10.697	62d06bdc-6589-477d-918f-7fc3b66534ea	\N	{}	feature	\N	\N	0	\N	\N	0
c5e5049a-00d6-4d0e-9454-1201c24b8a58	faabb466-efd3-41c0-8f36-df9cf6a43d5e	need one more ui enhance some ios calander issues please fix in booking page	<p><br></p>	done	medium	\N	\N	048f58f4-ebc0-4501-841b-d534fd6dc217	2026-01-28 20:05:26.149	2026-01-29 06:38:22.58	62d06bdc-6589-477d-918f-7fc3b66534ea	\N	{}	issue	\N	\N	0	\N	\N	0
\.


--
-- Data for Name: TaskComment; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."TaskComment" (id, "taskId", content, "userId", "clientId", "createdAt", "updatedAt", "parentId") FROM stdin;
7fb72b6e-b013-4587-8162-e90dc83ef2f5	a9a0361e-8f9e-464c-b089-0f1272b77a9c	<p>ok i am dogin</p>	ebe173c1-9846-47db-a65d-b4cd3e99fdce	\N	2026-01-28 15:13:45.16	2026-01-28 15:13:45.16	\N
8a637105-07b3-45dd-8f96-2f10d132ac74	a9a0361e-8f9e-464c-b089-0f1272b77a9c	can you please send some more samples	\N	62d06bdc-6589-477d-918f-7fc3b66534ea	2026-01-28 16:06:10.981	2026-01-28 16:06:10.981	\N
fb69a732-1d8a-4d49-b6eb-26a9f3c03c72	a9a0361e-8f9e-464c-b089-0f1272b77a9c	<p>@<span style="color: rgb(15, 23, 42); font-family: ui-sans-serif, system-ui, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;; font-size: 12px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 700; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; background-color: rgb(248, 250, 252); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;">Varun Kumar</span> ok sir.</p>	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	\N	2026-01-28 16:09:49.591	2026-01-28 16:09:49.591	\N
2a2a7b2a-87cd-4f48-bd0d-620d22849424	a9a0361e-8f9e-464c-b089-0f1272b77a9c	<p>done</p>	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	\N	2026-01-28 16:13:33.208	2026-01-28 16:13:33.208	\N
09885389-d241-4256-a798-7e0859991f1b	b4bb8bbd-2cdc-40c9-8259-505a2db18b6c	<strong>Changes Requested:</strong> its getting some issue during rendering can you please check again	\N	62d06bdc-6589-477d-918f-7fc3b66534ea	2026-01-28 16:15:18.405	2026-01-28 16:15:18.405	\N
c9dea2f9-c6b7-4e75-961b-f314d3f66eb8	c5e5049a-00d6-4d0e-9454-1201c24b8a58	<p>@client can you please share some screenshot so that i can check</p>	048f58f4-ebc0-4501-841b-d534fd6dc217	\N	2026-01-29 04:51:53.876	2026-01-29 04:51:53.876	\N
49ed94dd-795d-474f-b53a-5360c7a47f52	c5e5049a-00d6-4d0e-9454-1201c24b8a58	<p>hi</p>	048f58f4-ebc0-4501-841b-d534fd6dc217	\N	2026-01-29 04:52:54.86	2026-01-29 04:52:54.86	\N
966866e0-9226-4788-b47c-009a086d7e48	c5e5049a-00d6-4d0e-9454-1201c24b8a58	<p>yes tell me</p>	048f58f4-ebc0-4501-841b-d534fd6dc217	\N	2026-01-29 05:07:35.036	2026-01-29 05:07:35.036	49ed94dd-795d-474f-b53a-5360c7a47f52
15944c04-6def-4264-92ff-1be43a4e3cb5	c5e5049a-00d6-4d0e-9454-1201c24b8a58	<p>ok i will share</p>	\N	62d06bdc-6589-477d-918f-7fc3b66534ea	2026-01-29 05:10:19.399	2026-01-29 05:10:19.399	c9dea2f9-c6b7-4e75-961b-f314d3f66eb8
92dfd205-8c0c-4602-a1c2-1076dd07b21a	c5e5049a-00d6-4d0e-9454-1201c24b8a58	<p>how much time it will take</p><p><br></p>	\N	62d06bdc-6589-477d-918f-7fc3b66534ea	2026-01-29 05:42:29.745	2026-01-29 05:42:29.745	c9dea2f9-c6b7-4e75-961b-f314d3f66eb8
\.


--
-- Data for Name: TaskHistory; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."TaskHistory" (id, "taskId", "userId", "clientId", field, "oldValue", "newValue", "createdAt") FROM stdin;
542856de-dce3-4d4e-b684-23faae505837	a9a0361e-8f9e-464c-b089-0f1272b77a9c	ebe173c1-9846-47db-a65d-b4cd3e99fdce	\N	priority	\N	medium	2026-01-28 19:35:47.175
1c5239ed-c3fa-4768-b846-d2e5b2f31619	a9a0361e-8f9e-464c-b089-0f1272b77a9c	ebe173c1-9846-47db-a65d-b4cd3e99fdce	\N	description		Updated Description	2026-01-28 19:35:47.175
9a3c4185-17d1-49ee-b384-10043a50b4be	a9a0361e-8f9e-464c-b089-0f1272b77a9c	ebe173c1-9846-47db-a65d-b4cd3e99fdce	\N	status	done	review	2026-01-28 19:46:21.101
aaea07ed-36c4-4daa-8744-6c9ba2ff2038	a9a0361e-8f9e-464c-b089-0f1272b77a9c	ebe173c1-9846-47db-a65d-b4cd3e99fdce	\N	priority	\N	medium	2026-01-28 19:46:21.101
e3b2bcd3-0234-4516-be86-1d03b71a0605	a9a0361e-8f9e-464c-b089-0f1272b77a9c	ebe173c1-9846-47db-a65d-b4cd3e99fdce	\N	description		Updated Description	2026-01-28 19:46:21.101
724961d5-41f0-4d92-a055-4494f23aef99	a9a0361e-8f9e-464c-b089-0f1272b77a9c	ebe173c1-9846-47db-a65d-b4cd3e99fdce	\N	status	review	in-progress	2026-01-28 19:46:25.094
aad4772f-405c-4bdc-8200-27aa5601c86c	a9a0361e-8f9e-464c-b089-0f1272b77a9c	ebe173c1-9846-47db-a65d-b4cd3e99fdce	\N	priority	\N	medium	2026-01-28 19:46:25.094
c033206f-21a7-4cc5-89bf-da3e940d96cc	a9a0361e-8f9e-464c-b089-0f1272b77a9c	ebe173c1-9846-47db-a65d-b4cd3e99fdce	\N	description		Updated Description	2026-01-28 19:46:25.094
a3960a59-558e-4f76-9e05-e95dc992ed36	c5e5049a-00d6-4d0e-9454-1201c24b8a58	\N	62d06bdc-6589-477d-918f-7fc3b66534ea	status	review	done	2026-01-29 06:38:22.59
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
100dafd4-a994-4674-a665-ac5a8261c6f0	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	IGST	18.00		t	2026-01-29 14:19:22.594	2026-01-29 14:19:22.594
6d47936a-1933-4591-ab79-e76339cde890	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	CGST	9.00		t	2026-01-29 14:19:29.035	2026-01-29 14:19:29.035
2fa2d478-8cdd-4160-b96c-e34ba062136d	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	SGST	9.00		t	2026-01-29 14:19:35.223	2026-01-29 14:19:35.223
438d7a5d-22de-4cc1-b34d-04913be70ff7	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	No Tax	0.00	Exempt	t	2026-01-29 14:22:16.44	2026-01-29 14:22:16.44
\.


--
-- Data for Name: Timesheet; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Timesheet" (id, "companyId", "projectId", "employeeId", date, hours, "isBillable", description, "createdAt", "updatedAt", "endTime", "startTime", "taskId") FROM stdin;
01800eba-128f-404c-960a-5b3353dc2d96	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	faabb466-efd3-41c0-8f36-df9cf6a43d5e	582bbcd1-2f89-465a-88eb-b454a1dae1cc	2026-01-29	0.03	t	Timer Session	2026-01-29 05:55:36.328	2026-01-29 05:55:36.328	2026-01-29 05:55:36.325	2026-01-29 05:53:31.948	c5e5049a-00d6-4d0e-9454-1201c24b8a58
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
9be21c71-3f97-43b1-9ee0-772e2af81f63	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Service	srv	t	2026-01-29 14:21:35.735	2026-01-29 14:21:35.735
bc0178a2-e449-49b9-ae2c-daa022b08031	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Month	mo	t	2026-01-29 14:21:44.568	2026-01-29 14:21:44.568
7216ae33-5f60-48be-90bf-91dbbe3fbc5b	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Year	yr	t	2026-01-29 14:21:52.196	2026-01-29 14:21:52.196
aea1d698-b05a-4e12-8b47-6e8b10949253	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Hours	hr	t	2026-01-29 14:21:58.215	2026-01-29 14:21:58.215
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."User" (id, email, password, "firstName", "lastName", phone, "isActive", "lastLogin", "createdAt", "updatedAt", "resetToken", "resetTokenExpiry", "companyId") FROM stdin;
b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	admin@applizor.com	$2a$10$DpWhIvmPTMQL0LOm7NOmF.OXI2rlSSQHtgaXN6AYgP8pJ8MCXCucK	Admin	User	\N	t	2026-01-28 19:57:28.637	2026-01-23 04:26:48.968	2026-01-28 19:57:28.638	\N	\N	b81a0e3f-9301-43f7-a633-6db7e5fa54b0
ebe173c1-9846-47db-a65d-b4cd3e99fdce	applizor1@gmail.com	$2a$10$pSPz6rnU7WALMenxQ1SAHOoEtsSMv1l2fyRpG7pSIG47IItyubRU6	employee1	one		t	2026-01-28 19:57:32.589	2026-01-28 14:23:00.522	2026-01-28 19:57:32.59	\N	\N	b81a0e3f-9301-43f7-a633-6db7e5fa54b0
048f58f4-ebc0-4501-841b-d534fd6dc217	sapplizor@gmail.com	$2a$10$L6E0OAE3GiG90omkX/grDO/1ijlOkqO7BhhOq/8hqz9kfg.bptsNO	employee2	two		t	2026-01-29 04:49:17.642	2026-01-28 14:23:31.794	2026-01-29 04:49:17.643	\N	\N	b81a0e3f-9301-43f7-a633-6db7e5fa54b0
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."UserRole" (id, "userId", "roleId", "createdAt") FROM stdin;
6885b1cd-53be-49a8-a807-0a1090128892	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.977
efdf1e71-37c1-4698-ba8f-592cd9f45993	ebe173c1-9846-47db-a65d-b4cd3e99fdce	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:23:00.525
b03c675d-363d-4faa-9b6a-cb553f12beda	048f58f4-ebc0-4501-841b-d534fd6dc217	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-28 14:23:31.798
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
80b007ef-e154-4f02-af23-801efcb6f28c	a2be4b626e745742ec8cf29145dd9c2cd6e6846d35d80270807bbd6a2861e6fa	2026-01-28 14:28:24.120819+00	20260126084459_add_contract_fields	\N	\N	2026-01-28 14:28:24.109772+00	1
4b39c3d2-58bc-4779-b22b-dd6a71ee5c9c	bf50a5065fcbcaac01945915cc6f4e89091fc1037fd1a8e714643c262053da0f	2026-01-28 14:28:24.135933+00	20260126103709_add_client_enhanced_fields	\N	\N	2026-01-28 14:28:24.123332+00	1
fb97df88-c297-4977-9b76-291cf45cdce8	5e201308c175d290e53dedb3f48e3f73b250da80943428e496725f2fa32d4265	2026-01-28 14:28:24.176949+00	20260126104218_add_client_comprehensive_details	\N	\N	2026-01-28 14:28:24.138084+00	1
4aec5817-d7e6-43d3-aca9-8f58b0d52a95	998bfec3f415ad317d8e2aa3932a3fff9e75c52a5211e32a27d294575fb2269b	2026-01-28 14:28:24.18442+00	20260126105252_add_client_company_name_v2	\N	\N	2026-01-28 14:28:24.179122+00	1
\.


--
-- Data for Name: active_timers; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public.active_timers (id, "companyId", "employeeId", "projectId", "taskId", "startTime") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public.notifications (id, "companyId", "userId", title, message, type, "isRead", link, "createdAt") FROM stdin;
ee4098cb-e071-4e7a-9bca-9ac331772abd	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	ebe173c1-9846-47db-a65d-b4cd3e99fdce	Task Assigned	You are now assigned to: need one more ui enhance some ios calander issues please fix in booking page	task_assigned	f	/projects/faabb466-efd3-41c0-8f36-df9cf6a43d5e/tasks	2026-01-28 20:06:03.49
\.


--
-- Data for Name: quotation_templates; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public.quotation_templates (id, "companyId", name, description, category, title, "templateDescription", "paymentTerms", "deliveryTerms", notes, items, "isActive", "usageCount", "createdBy", "createdAt", "updatedAt") FROM stdin;
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
-- Name: active_timers_employeeId_key; Type: INDEX; Schema: public; Owner: applizor
--

CREATE UNIQUE INDEX "active_timers_employeeId_key" ON public.active_timers USING btree ("employeeId");


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

\unrestrict fY6aWZsFde52CiykADerBmkh8s3a7RevpV13OWBVTPgMwP4jMaapyjUKckXqf53

