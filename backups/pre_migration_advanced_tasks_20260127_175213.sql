--
-- PostgreSQL database dump
--

\restrict 4Xfd42W4fFojMlgZUE3yLUFva98o16Wzi7iwF4jHpDIkdxiMWS2QXfU4gNZu3wj

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
    "companyName" text
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
    priority text DEFAULT 'medium'::text NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    settings jsonb
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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "milestoneId" text
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
9e2150c4-a28d-484d-99c4-cf16246898e8	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	2026-01-26	2026-01-26 13:02:17.832	\N	present	::ffff:192.168.65.1	18.539832084298013,73.94504782890894	\N	2026-01-26 13:02:17.833	2026-01-26 13:02:17.833
0e6469a3-d9ca-44fb-92fa-57b72ec02a5f	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	2026-01-27	2026-01-27 06:26:42.87	\N	present	::ffff:192.168.65.1	18.539770749863937,73.94509739243485	\N	2026-01-27 06:26:42.871	2026-01-27 06:26:42.871
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

COPY public."Client" (id, "companyId", name, email, phone, address, city, state, country, pincode, gstin, pan, status, "clientType", "createdAt", "updatedAt", password, "portalAccess", "lastLogin", "createdById", notes, "shippingAddress", "taxName", website, "categoryId", "companyLogo", gender, language, mobile, "profilePicture", "receiveNotifications", salutation, "subCategoryId", "companyName") FROM stdin;
b5fbcbfd-deb9-421b-9932-fb1420d0562a	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Arun Kumar Vishwakarma	arun1601for@gmail.com	+919226889662	404 VARADRAJ HEIGHTS\nSHIVTIRTH NAGAR MARUNJI ROAD HINJEWADI PHASE 1	PUNE	Maharashtra	India	411057			active	customer	2026-01-23 04:35:58.81	2026-01-26 12:52:16.601	$2a$10$B0n9HLvgDG/lwf7BBUgP4u8IrreeW/A5BwrkyJgoVibrfiw7WDKQ6	t	2026-01-26 12:52:16.6	\N		404 VARADRAJ HEIGHTS\nSHIVTIRTH NAGAR MARUNJI ROAD HINJEWADI PHASE 1		safalcode.com	ebf7056f-5c8a-4912-9cd6-bd978b03433b	/uploads/logos/image-1769426410650-582254553.png	male	English	7773899355	/uploads/profiles/profile-1769426405654-928529587.png	t	Mr.	\N	Safalcode Tech
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

COPY public."Company" (id, name, "legalName", email, phone, address, city, state, country, pincode, gstin, pan, logo, "letterheadDoc", "allowedIPs", latitude, longitude, radius, "isActive", "enabledModules", "createdAt", "updatedAt", currency, tan, "continuationSheet", "digitalSignature", letterhead, "pdfContinuationTop", "pdfMarginBottom", "pdfMarginLeft", "pdfMarginRight", "pdfMarginTop") FROM stdin;
b81a0e3f-9301-43f7-a633-6db7e5fa54b0	Applizor Softech LLP	Applizor Softech LLP	connect@applizor.com	9130309480	209, WARD NO 7, VISHWAKARMA MUHALLA, GARROLI	Chhatarpur	Madhya Pradesh	India	471201	27AAAAA0000A1Z5	\N	/uploads/logos/logo-1769142517693-126258508.png	\N	\N	\N	\N	100	t	null	2026-01-23 04:26:48.633	2026-01-23 05:22:12.815	INR	\N	/uploads/letterheads/continuationSheet-1769142583385-342094364.pdf	/uploads/signatures/signature-1769142563754-622063357.png	/uploads/letterheads/letterhead-1769142579407-299075121.pdf	130	60	50	50	130
\.


--
-- Data for Name: Contract; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Contract" (id, "companyId", "clientId", "projectId", "creatorId", title, content, status, "validFrom", "validUntil", "sentAt", "signedAt", "clientSignature", "signerName", "signerIp", "companySignature", "companySignerId", "companySignedAt", "pdfPath", "templateId", "createdAt", "updatedAt", "viewCount", "lastViewedAt", "emailOpens", "lastEmailOpenedAt", "contractType", "contractValue", currency) FROM stdin;
2c3269e5-cbad-43b3-b28e-d613459b733e	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	b5fbcbfd-deb9-421b-9932-fb1420d0562a	\N	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	SOFTWARE DEVELOPMENT AGREEMENT	<p>This Software Development Agreement (“Agreement”) is made and entered into on <strong>26/01/2026</strong>, by and between:</p><p><strong>Client Name:</strong> Arun Kumar Vishwakarma</p><p> <strong>Client Company:</strong> Safalcode Tech</p><p> <strong>Address:</strong> 404 VARADRAJ HEIGHTS\nSHIVTIRTH NAGAR MARUNJI ROAD HINJEWADI PHASE 1, PUNE</p><p> (hereinafter referred to as the “Client”)</p><p>AND</p><p><strong>Service Provider:</strong> Applizor Softech LLP</p><p> (hereinafter referred to as the “Company”)</p><p>The Client and the Company are collectively referred to as the “Parties”.</p><h2>1. PURPOSE OF AGREEMENT</h2><p>The Client agrees to engage the Company to design, develop, and deliver a <strong>self-hosted video news platform</strong> including a website, mobile applications, and Android TV application for the Client’s brand <strong>Peptech Time</strong>, as per the scope defined in this Agreement.</p><h2>2. SCOPE OF WORK</h2><p>The Company shall provide the following services:</p><h3>2.1 Website Development</h3><ul><li>Technology stack: React.js (Frontend) + Spring Boot (Backend)</li><li>SEO-optimized frontend</li><li>Admin dashboard for managing news, reporters, and media</li><li>Multilingual news publishing (Hindi, English, Hinglish)</li><li>Self-hosted video uploads</li><li>Custom HLS video player (Video.js / Shaka Player)</li><li>Live streaming using RTMP + HLS</li><li>Reporter login and approval workflow</li><li>Donation integration (Razorpay / Instamojo)</li><li>Video advertisements (VAST tag support)</li><li>Affiliate links and banner support</li><li>Security (JWT authentication, SSL, secure APIs)</li><li>Performance optimization (caching, compression, lazy loading)</li><li>Regular backups and monitoring</li></ul><h3>2.2 Infrastructure Setup</h3><ul><li>VPS / Cloud server setup (DigitalOcean / Linode)</li><li>CDN configuration (Cloudflare)</li><li>Media storage integration (Amazon S3 / Wasabi)</li></ul><h3>2.3 Mobile &amp; TV Application Development</h3><ul><li>Single codebase using React Native</li><li>Android Phone &amp; Tablet App</li><li>iOS App</li><li>Android TV App with custom layout and remote controls</li><li>HLS video streaming</li><li>Multilingual news viewer</li><li>Push notifications</li><li>User login and donation system</li><li>Chromecast &amp; Android TV playback support</li><li>App Store &amp; Play Store compliance</li></ul><h2>3. PROJECT TIMELINE</h2><p>PhaseEstimated DurationWebsite Development4–5 WeeksAndroid &amp; iOS Apps2–3 WeeksAndroid TV App1–2 Weeks</p><p>Timelines may vary depending on feedback cycles and content availability from the Client.</p><h2>4. COMMERCIAL TERMS</h2><p>DescriptionAmount (INR)Website Development₹60,000Mobile &amp; TV App Development₹60,000<strong>Total Project Cost₹1,20,000</strong></p><p>Taxes, if applicable, shall be charged additionally as per government norms.</p><h2>5. PAYMENT TERMS</h2><ul><li>50% advance payment before project initiation</li><li>30% upon completion of website development</li><li>20% after final delivery and deployment</li></ul><p>Payments must be made via bank transfer or approved digital payment methods.</p><h2>6. CLIENT RESPONSIBILITIES</h2><p>The Client agrees to:</p><ul><li>Provide timely content, branding assets, and approvals</li><li>Ensure availability for feedback and testing</li><li>Arrange third-party service accounts (hosting, payment gateway, cloud storage)</li><li>Comply with applicable content and broadcasting laws</li></ul><h2>7. INTELLECTUAL PROPERTY RIGHTS</h2><ul><li>Upon full payment, the Client shall own the <strong>final developed software and content</strong></li><li>The Company retains the right to showcase the project in its portfolio</li><li>Reuse or resale of source code without permission is prohibited</li></ul><h2>8. CONFIDENTIALITY</h2><p>Both Parties agree to maintain strict confidentiality of all business, technical, and financial information shared during the project.</p><h2>9. WARRANTY &amp; LIMITATION OF LIABILITY</h2><ul><li>The Company warrants that services will be delivered professionally</li><li>The Company shall not be liable for:</li><li class="ql-indent-1">Third-party service failures</li><li class="ql-indent-1">Hosting or CDN downtime</li><li class="ql-indent-1">Content-related legal issues</li><li>Maximum liability shall not exceed the total project cost paid</li></ul><h2>10. TERMINATION</h2><p>Either Party may terminate this Agreement with <strong>15 days written notice</strong>.</p><p> Payments for completed work up to the termination date shall remain payable.</p><h2>11. MAINTENANCE &amp; SUPPORT</h2><p>Post-delivery maintenance and feature enhancements shall be handled under a <strong>separate AMC or support agreement</strong>, if required.</p><h2>12. GOVERNING LAW</h2><p>This Agreement shall be governed and interpreted in accordance with the laws of <strong>India</strong>.</p><p> Any disputes shall be subject to the jurisdiction of the Company’s registered location.</p><h2>13. ACCEPTANCE &amp; SIGNATURES</h2><p>By signing below, both Parties agree to the terms and conditions of this Agreement.</p>	signed	2026-01-26	2026-01-27	\N	2026-01-26 12:11:36.743	data:image/png;base64,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	Arun Kumar Vishwakarma	::ffff:192.168.65.1	data:image/png;base64,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/v3702KLW9mff/5pxs340+tz9+7dsn379qh9ZxdmUQekBYqAIpApBOIuQFgcypcvL5Zq164tzz//vCxbtixTA7SVFi5cKH379k1zYbK8iQgRFi+99JJUqFBBbr31VrnjjjukYsWK8uqrr0YUJB999JFUr15datSoYXivuuoq+e6779Ic6qeffmpwnD59uo9v7NixUqVKFbn55pulatWqMnjwYF85CRZ56tWpU8e0MWbMGLLTpWCfq1evlubNm8vVV19txs346XPixImp2tq6das8/PDDUrlyZalWrZrQN4LVMiYCM9uXhopAwhA4jDuKuwCxWJ5yyimC8Dj55JNlypQpZjGZNm2aLc5w+NNPP8mwYcNk165dGa6bFRVYDD/88EO58MIL5bHHHpPGjRvLSSedJG+//bYht0+ExwsvvCDJycny6KOPynPPPSfXXHNNmsKQE8abb74p4IiwsO198cUX0qlTJylSpIhp5/zzzzcCZPTo0ZZFOJnce++98uyzz4YF9z///BMujxaJ1OfKlSuFPhnDU089JbVq1RJOGB06dBCEum2Luk2aNJFvvvlG7r//foMJm4ZGjRrJ3r17DVtWY2Y60YcioAgkDIEsEyDnnHOOWcAGDhwob7zxhhx99NHyyiuvSDTVDQtQwmYdh47y589v5oNQa9iwoREgr7/+umnZ3e0zryFDhhjhAg4sqHfffbf07t3bCBFTIcJj/vz5ZvF/4IEHJF++fGEOTh8kevToIbTTpk0bkvLee++ZkMeWLVvk119/lbp16xphQ14sFKnP008/Xd555x2hP9pr3bq1IAxpj40BIYSAX7p0qdx2222CIAETTlyMZc6cObBIVmNmOtGHIqAIJAyBLBMg7gwuuugis9ixmMyYMSNcNHv2bGnatKlReVx++eXmlDJ06FBBDWaZUBOx6I4YMcJkPfPMM0IasguTKfAe7JYpR4UCNfdUL64KxWMxfyyuDz30kEBfffWVycvog8UQNU0odPD/mTjzzDPltNNOE9dO8OOPPwrjuueee8ypwe0nFDpY180njmBC6LIgk4b27Nkjs2bNkosvvlhY2MlDKBHSx2+//UZUihYtKpyOODFwAjSZMTwi9Uk/F1xwga/2lVdeadLr1q0zIQ9OKYSo1QjBGHUYcfvOI2MWP8zoS0kRUAQSh0BCBAjTQedPuGLFCgJDn332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	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	2026-01-26 11:46:28.278	\N	\N	2026-01-26 11:46:01.428	2026-01-26 12:37:07.791	7	2026-01-26 12:37:07.79	0	\N		50000.00	INR
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

COPY public."Document" (id, "companyId", "clientId", "invoiceId", "employeeId", "projectId", name, type, category, "filePath", "fileSize", "mimeType", version, "isTemplate", tags, metadata, "createdAt", "updatedAt") FROM stdin;
56a3dc63-8438-44b4-8ff6-54e515295d66	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	\N	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	\N	Contract-SOFTWARE DEVELOPMENT AGREEMENT (7).pdf	document	\N	/uploads/documents/file-1769431869789-660654956.pdf	76130	application/pdf	1	f	\N	\N	2026-01-26 12:51:09.814	2026-01-26 12:51:09.814
452964d8-de84-407b-b2fa-37aef0b69827	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	\N	\N	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	\N	a62d36b5e828c380ac280eb549e24e13.png	document	\N	/uploads/documents/file-1769432873584-321057975.png	50939	image/png	1	f	\N	\N	2026-01-26 13:07:53.627	2026-01-26 13:07:53.627
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
4a00d49b-a4d8-4282-a0b4-4e5bf3456419	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	EMP-0001	emp1	EMP	applizor1@gmail.com		Male		Single	1998-04-01 00:00:00	2026-01-26 00:00:00	Bhopal madhya pradesh india	Bhopal madhya pradesh india	\N						a9e50298-d5db-4b87-8ab6-a8e12194321d	020858a5-3766-4388-99cb-39f9af2c2879	\N	\N	\N	active	2026-01-26 12:40:38.733	2026-01-26 12:41:01.116	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	Full Time	\N	\N	\N	\N	""		f
\.


--
-- Data for Name: EmployeeLeaveBalance; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."EmployeeLeaveBalance" (id, "employeeId", "leaveTypeId", year, allocated, "carriedOver", used, "createdAt", "updatedAt") FROM stdin;
efbc39e8-d608-43b2-ab71-360203722785	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	c01b69ee-83c0-482d-af93-ad1690bc371d	2026	4	0	0	2026-01-26 12:40:38.756	2026-01-26 12:40:38.756
a9cfe78b-2b4e-4fd9-b49f-ace56fff7074	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	6e2652ac-a743-42eb-a56f-561af5f05646	2026	4	0	0	2026-01-26 12:40:38.756	2026-01-26 12:40:38.756
a1180278-906e-4eb6-b146-181cdc516112	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	9d6bebad-72ef-43c9-96e1-afa64c1616ef	2026	0	0	0	2026-01-26 12:40:38.756	2026-01-26 12:40:38.756
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
f0fdc3b7-dd0d-4d22-9ba3-db81214f6a14	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	b5fbcbfd-deb9-421b-9932-fb1420d0562a	INV-2026-0001	2026-01-23	2026-02-22	partial	invoice	INR		120000.00	21600.00	0.00	141600.00	1000.00	f	\N		\N	2026-01-23 05:25:50.693	2026-01-26 12:09:24.692	\N	\N	monthly
\.


--
-- Data for Name: InvoiceItem; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."InvoiceItem" (id, "invoiceId", description, "hsnCode", quantity, rate, "taxRate", amount, "createdAt") FROM stdin;
9b2b220a-7d7e-462d-a10c-d97573cfc62c	f0fdc3b7-dd0d-4d22-9ba3-db81214f6a14	Website Development (React.js + Spring Boot)		1.00	60000.00	18.00	60000.00	2026-01-26 12:08:36.175
22e869de-0c32-4748-85cc-7ef750a04014	f0fdc3b7-dd0d-4d22-9ba3-db81214f6a14	Mobile App Development (React Native)		1.00	60000.00	18.00	60000.00	2026-01-26 12:08:36.175
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
-- Data for Name: Milestone; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Milestone" (id, "projectId", title, description, "dueDate", amount, status, "order", "createdAt", "updatedAt") FROM stdin;
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
72da6e7e-ebf6-4d34-bb4f-ce02be961ed3	f0fdc3b7-dd0d-4d22-9ba3-db81214f6a14	1000.00	2026-01-26	bank-transfer	\N	\N	\N	success	\N	2026-01-26 12:09:24.705	2026-01-26 12:09:24.705
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

COPY public."Project" (id, "companyId", "clientId", name, description, status, "startDate", "endDate", budget, "isBillable", "createdAt", "updatedAt", "actualExpenses", "actualRevenue", priority, tags, settings) FROM stdin;
9aa9231b-55ed-4db9-91f8-f64014040d50	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	b5fbcbfd-deb9-421b-9932-fb1420d0562a	safalcode		active	2026-01-27 00:00:00	\N	\N	t	2026-01-27 05:50:34.813	2026-01-27 05:50:34.813	\N	\N	medium	{}	\N
\.


--
-- Data for Name: ProjectMember; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ProjectMember" (id, "projectId", "employeeId", role, "joinedAt") FROM stdin;
548fff97-376f-4d1c-a183-be532dcb3f60	9aa9231b-55ed-4db9-91f8-f64014040d50	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	member	2026-01-27 06:25:37.336
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
fbd2165d-3336-49b8-9b1f-188fbcd27b25	Admin	Full system access	t	2026-01-23 04:26:48.646	2026-01-26 13:27:00.794
2af33051-91e2-49b0-be8e-e879b80dc41c	Employee	Regular Employee	f	2026-01-23 04:26:48.771	2026-01-27 06:27:55.696
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
112b1e35-5b2f-41a0-bb81-c0d58faab0e2	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-23 04:26:48.774	none	none	Dashboard	all	none
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
1bfc5900-d3a5-4f67-b332-7ac0553f0e68	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.668	all	all	LeadActivity	all	all
61565b46-784e-45c5-a9ac-85fbea87c491	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-26 13:27:00.911	all	all	Project	all	all
700445e6-3ca5-4257-b357-33f3c42c6f5f	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-26 13:27:00.913	all	all	ProjectTask	all	all
446bcf24-f151-476f-98bb-021892c2d8da	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.517	none	none	Company	none	none
67789627-57d5-4c0b-808b-435d53cdcbf9	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.523	none	none	User	none	none
9e581516-1c88-4761-9231-54b201ed7523	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.526	none	none	Role	none	none
c029aef5-8e81-4b5a-aa0f-a0028cf58bc6	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.528	none	none	Client	none	none
efb8c468-8414-49a6-9f91-74e05da5176a	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.531	none	none	Lead	none	none
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
3d4bc11d-7411-425f-83e4-70b1c8cdf1e6	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-27 06:27:56.195	all	added_owned	ProjectTask	added_owned	added_owned
72a8d6f4-2a01-461e-afcc-eab8399c02c6	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 13:01:57.585	none	none	Contract	none	none
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
e878e7f8-b9f4-4353-9cf9-72e0a39afc64	b81a0e3f-9301-43f7-a633-6db7e5fa54b0	General Shift	10:00	19:00	60	t	2026-01-26 12:43:19.494	2026-01-26 12:43:19.494	["monday", "tuesday", "wednesday", "thursday", "friday"]
\.


--
-- Data for Name: ShiftRoster; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."ShiftRoster" (id, "employeeId", "shiftId", date, "createdAt", "updatedAt") FROM stdin;
3c12aaf5-d0cb-4635-be47-07543e3a167d	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-27	2026-01-26 12:44:32.149	2026-01-26 12:44:32.149
d577275f-7af8-4550-b519-02e8903a43c4	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-28	2026-01-26 12:44:32.149	2026-01-26 12:44:32.149
e999859c-b75e-4810-b2cc-111788d87e3d	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-29	2026-01-26 12:44:32.149	2026-01-26 12:44:32.149
20daf404-ac5a-437e-bae0-64d36c841846	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-01-30	2026-01-26 12:44:32.149	2026-01-26 12:44:32.149
b0cf204a-6cbf-4fea-b84e-90fed7022edc	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-02	2026-01-26 12:45:51.049	2026-01-26 12:45:51.049
b6f8e77c-18e6-48bf-b089-229b7fd44ec6	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-03	2026-01-26 12:45:51.049	2026-01-26 12:45:51.049
5b011de6-a531-4501-9081-5cf0f1b73aed	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-04	2026-01-26 12:45:51.049	2026-01-26 12:45:51.049
a3f95d4b-7c39-4964-b9c8-186f145cf7f7	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-05	2026-01-26 12:45:51.049	2026-01-26 12:45:51.049
c4266a86-8b12-42df-ada6-f72c8f7bae05	4a00d49b-a4d8-4282-a0b4-4e5bf3456419	e878e7f8-b9f4-4353-9cf9-72e0a39afc64	2026-02-06	2026-01-26 12:45:51.049	2026-01-26 12:45:51.049
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Subscription" (id, "companyId", "clientId", name, plan, amount, "billingCycle", "startDate", "endDate", status, "nextBillingDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."Task" (id, "projectId", title, description, status, priority, "dueDate", "createdById", "assignedToId", "createdAt", "updatedAt", "milestoneId") FROM stdin;
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
b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	admin@applizor.com	$2a$10$DpWhIvmPTMQL0LOm7NOmF.OXI2rlSSQHtgaXN6AYgP8pJ8MCXCucK	Admin	User	\N	t	2026-01-26 14:56:07.337	2026-01-23 04:26:48.968	2026-01-26 14:56:07.339	\N	\N	b81a0e3f-9301-43f7-a633-6db7e5fa54b0
c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	applizor1@gmail.com	$2a$10$Brdn50k.Xb1niec3Rv18OuyUYj6N9hzvlbCmQ8egD09VqjURs4r86	emp1	EMP		t	2026-01-27 06:26:19.985	2026-01-26 12:40:38.713	2026-01-27 06:26:19.986	\N	\N	b81a0e3f-9301-43f7-a633-6db7e5fa54b0
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: applizor
--

COPY public."UserRole" (id, "userId", "roleId", "createdAt") FROM stdin;
6885b1cd-53be-49a8-a807-0a1090128892	b4c0ba54-4a92-48fc-8a99-b27dd9de46f9	fbd2165d-3336-49b8-9b1f-188fbcd27b25	2026-01-23 04:26:48.977
e3e648d7-5a08-4bc8-9afb-c1d842c1db4b	c96691f5-7dcd-4fd3-9eb0-0e212ca052fa	2af33051-91e2-49b0-be8e-e879b80dc41c	2026-01-26 12:40:38.723
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
-- Name: Task_milestoneId_idx; Type: INDEX; Schema: public; Owner: applizor
--

CREATE INDEX "Task_milestoneId_idx" ON public."Task" USING btree ("milestoneId");


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
-- Name: Task Task_milestoneId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: applizor
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES public."Milestone"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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

\unrestrict 4Xfd42W4fFojMlgZUE3yLUFva98o16Wzi7iwF4jHpDIkdxiMWS2QXfU4gNZu3wj

