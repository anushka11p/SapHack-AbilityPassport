using { abilitypassport as ap } from '../db/schema';

service PassportService {
  entity Candidates    as projection on ap.Candidates;
  entity Tasks         as projection on ap.Tasks;
  entity Submissions   as projection on ap.Submissions;
  entity Verifications as projection on ap.Verifications;
  entity Consents      as projection on ap.Consents;
  entity Decisions     as projection on ap.Decisions;

  action submitWork(taskID: UUID, candidateID: UUID, answer: String) returns String;
  action grantConsent(candidateID: UUID, employerName: String) returns Boolean;
  function passportFor(candidateID: UUID, employerName: String) returns String;
}
