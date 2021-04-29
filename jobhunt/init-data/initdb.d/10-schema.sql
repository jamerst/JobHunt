CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE "Categories" (
    "Id" text NOT NULL,
    "Name" text NOT NULL,
    CONSTRAINT "PK_Categories" PRIMARY KEY ("Id")
);

CREATE TABLE "Companies" (
    "Id" text NOT NULL,
    "Name" text NOT NULL,
    "Location" text NOT NULL,
    "Notes" text NULL,
    "Website" text NULL,
    "CareersPage" text NULL,
    "CareersHash" text NULL,
    "CareersCssSelector" text NULL,
    "CareersLastScraped" timestamp without time zone NULL,
    "CareersLastUpdated" timestamp without time zone NULL,
    "Rating" smallint NULL,
    "Glassdoor" text NULL,
    "LinkedIn" text NULL,
    "Endole" text NULL,
    CONSTRAINT "PK_Companies" PRIMARY KEY ("Id")
);

CREATE TABLE "CompanyCategories" (
    "CompanyId" text NOT NULL,
    "CategoryId" text NOT NULL,
    CONSTRAINT "PK_CompanyCategories" PRIMARY KEY ("CompanyId", "CategoryId"),
    CONSTRAINT "FK_CompanyCategories_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_CompanyCategories_Companies_CompanyId" FOREIGN KEY ("CompanyId") REFERENCES "Companies" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Jobs" (
    "Id" text NOT NULL,
    "Title" text NOT NULL,
    "Description" text NOT NULL,
    "Salary" text NULL,
    "Location" text NOT NULL,
    "Url" text NULL,
    "CompanyId" text NULL,
    "Posted" timestamp without time zone NULL,
    "Notes" text NULL,
    "Archived" boolean NOT NULL,
    "Status" text NOT NULL,
    "DateApplied" timestamp without time zone NULL,
    CONSTRAINT "PK_Jobs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Jobs_Companies_CompanyId" FOREIGN KEY ("CompanyId") REFERENCES "Companies" ("Id") ON DELETE CASCADE
);

CREATE TABLE "JobCategories" (
    "JobId" text NOT NULL,
    "CategoryId" text NOT NULL,
    CONSTRAINT "PK_JobCategories" PRIMARY KEY ("JobId", "CategoryId"),
    CONSTRAINT "FK_JobCategories_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_JobCategories_Jobs_JobId" FOREIGN KEY ("JobId") REFERENCES "Jobs" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_CompanyCategories_CategoryId" ON "CompanyCategories" ("CategoryId");

CREATE INDEX "IX_JobCategories_CategoryId" ON "JobCategories" ("CategoryId");

CREATE INDEX "IX_Jobs_CompanyId" ON "Jobs" ("CompanyId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20210422211329_InitialCreate', '5.0.5');

COMMIT;

START TRANSACTION;

ALTER TABLE "Jobs" ADD "SearchSourceId" text NULL;

ALTER TABLE "Jobs" ADD "Source" text NULL;

ALTER TABLE "Jobs" ADD "SourceId" text NULL;

ALTER TABLE "Companies" ADD "Blacklisted" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "Companies" ADD "CareersCssBlacklist" text NULL;

ALTER TABLE "Companies" ADD "GlassdoorId" text NULL;

ALTER TABLE "Companies" ADD "GlassdoorRating" real NULL;

ALTER TABLE "Companies" ADD "Watched" boolean NOT NULL DEFAULT FALSE;

CREATE TABLE "CompanyNames" (
    "CompanyId" text NOT NULL,
    "Name" text NOT NULL,
    "Id" text NULL,
    CONSTRAINT "PK_CompanyNames" PRIMARY KEY ("CompanyId", "Name"),
    CONSTRAINT "FK_CompanyNames_Companies_CompanyId" FOREIGN KEY ("CompanyId") REFERENCES "Companies" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Searches" (
    "Id" text NOT NULL,
    "Provider" text NOT NULL,
    "Query" text NOT NULL,
    "Country" text NOT NULL,
    "Location" text NULL,
    "Distance" integer NULL,
    "MaxAge" integer NULL,
    CONSTRAINT "PK_Searches" PRIMARY KEY ("Id")
);

CREATE INDEX "IX_Jobs_SearchSourceId" ON "Jobs" ("SearchSourceId");

ALTER TABLE "Jobs" ADD CONSTRAINT "FK_Jobs_Searches_SearchSourceId" FOREIGN KEY ("SearchSourceId") REFERENCES "Searches" ("Id") ON DELETE SET NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20210425202326_Searches', '5.0.5');

COMMIT;

START TRANSACTION;

ALTER TABLE "Jobs" DROP CONSTRAINT "FK_Jobs_Searches_SearchSourceId";

DROP INDEX "IX_Jobs_SearchSourceId";

ALTER TABLE "Jobs" RENAME COLUMN "Source" TO "ProviderId";

ALTER TABLE "Jobs" RENAME COLUMN "SearchSourceId" TO "Provider";

ALTER TABLE "Searches" ADD "LastFetchSuccess" boolean NULL;

ALTER TABLE "Searches" ADD "LastResultCount" integer NULL;

ALTER TABLE "Searches" ADD "LastRun" timestamp without time zone NULL;

CREATE INDEX "IX_Jobs_SourceId" ON "Jobs" ("SourceId");

ALTER TABLE "Jobs" ADD CONSTRAINT "FK_Jobs_Searches_SourceId" FOREIGN KEY ("SourceId") REFERENCES "Searches" ("Id") ON DELETE SET NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20210426195040_NullableIds', '5.0.5');

COMMIT;

START TRANSACTION;

ALTER TABLE "Companies" DROP COLUMN "CareersCssBlacklist";

ALTER TABLE "Companies" DROP COLUMN "CareersCssSelector";

ALTER TABLE "Companies" DROP COLUMN "CareersHash";

ALTER TABLE "Companies" DROP COLUMN "CareersLastScraped";

ALTER TABLE "Companies" DROP COLUMN "CareersLastUpdated";

ALTER TABLE "Companies" DROP COLUMN "CareersPage";

CREATE TABLE "CompanyCareersPages" (
    "Id" text NOT NULL,
    "CompanyId" text NOT NULL,
    "Url" text NOT NULL,
    "Hash" text NULL,
    "CssSelector" text NULL,
    "CssBlacklist" text NULL,
    "LastScraped" timestamp without time zone NULL,
    "LastUpdated" timestamp without time zone NULL,
    "StatusMessage" text NULL,
    CONSTRAINT "PK_CompanyCareersPages" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CompanyCareersPages_Companies_CompanyId" FOREIGN KEY ("CompanyId") REFERENCES "Companies" ("Id") ON DELETE CASCADE
);

CREATE TABLE "SearchRuns" (
    "Id" text NOT NULL,
    "SearchId" text NOT NULL,
    "Time" timestamp without time zone NOT NULL,
    "Success" boolean NOT NULL,
    "Message" text NULL,
    "NewJobs" integer NOT NULL,
    "NewCompanies" integer NOT NULL,
    "TimeTaken" integer NOT NULL,
    CONSTRAINT "PK_SearchRuns" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SearchRuns_Searches_SearchId" FOREIGN KEY ("SearchId") REFERENCES "Searches" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_CompanyCareersPages_CompanyId" ON "CompanyCareersPages" ("CompanyId");

CREATE INDEX "IX_SearchRuns_SearchId" ON "SearchRuns" ("SearchId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20210429192858_CareersPages_SearchRuns', '5.0.5');

COMMIT;
