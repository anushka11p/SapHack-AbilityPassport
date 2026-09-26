namespace abilitypassport;
using { cuid, managed } from '@sap/cds/common';

entity Candidates : cuid, managed {
  displayName : String(100);
  email       : String(120);
  workPrefs   : String(500);
}

entity Tasks : cuid, managed {
  title     : String(150);
  jobFamily : String(60);
  brief     : LargeString;
  rubricKey : String(60);
}

entity Submissions : cuid, managed {
  candidate   : Association to Candidates;
  task        : Association to Tasks;
  answer      : LargeString;
  submittedAt : Timestamp;
  status      : String(20);
}

entity Verifications : cuid, managed {
  submission    : Association to Submissions;
  overallScore  : Decimal(3,1);
  skillScores   : LargeString;
  reasoning     : LargeString;
  modelUsed     : String(60);
  confidence    : String(10);
  humanReviewed : Boolean default false;
}

entity Consents : cuid, managed {
  candidate    : Association to Candidates;
  employerName : String(120);
  granted      : Boolean default false;
  grantedAt    : Timestamp;
  revokedAt    : Timestamp;
}

entity Decisions : cuid, managed {
  candidate    : Association to Candidates;
  employerName : String(120);
  action       : String(30);
  decidedBy    : String(120);
  note         : String(500);
}
