#!/bin/bash
URL="https://ability-passport-srv-terrific-zebra-le.cfapps.ap21.hana.ondemand.com/odata/v4/passport"
CAND="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

echo "Clearing previous demo data..."
for entity in Verifications Submissions Consents Decisions; do
  ids=$(curl -s "$URL/$entity?\$select=ID" | grep -o '"ID":"[^"]*"' | cut -d'"' -f4)
  for id in $ids; do
    curl -s -X DELETE "$URL/$entity/$id" > /dev/null
  done
  echo "  cleared $entity"
done

echo ""
echo "Checking backend is alive..."
curl -s "$URL/Tasks?\$select=title" | grep -o '"title":"[^"]*"' | cut -d'"' -f4

echo ""
echo "Consent check (should say NO_CONSENT):"
curl -s "$URL/passportFor(candidateID='$CAND',employerName='MeeraCorp')"
echo ""
echo ""
echo "Ready for demo."
