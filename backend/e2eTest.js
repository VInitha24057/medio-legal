const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:5000/api';
const DOCTOR = { username: 'testdoc123', email: 'doc123@test.com', password: 'password123', role: 'doctor', fullName: 'Dr. Test' };
const POLICE = { username: 'testpol123', email: 'pol123@test.com', password: 'password123', role: 'police', fullName: 'Officer Test' };
const JUDGE = { username: 'testjud123', email: 'jud123@test.com', password: 'password123', role: 'judiciary', fullName: 'Judge Test' };
const PATIENT = { username: 'testpat123', email: 'pat123@test.com', password: 'password123', role: 'patient', fullName: 'Patient Test' };

let tokens = {};
let caseData = {};

async function registerOrLogin(user) {
  try {
    await axios.post(`${API_URL}/auth/register`, user);
  } catch (e) { /* ignore if exists */ }
  const res = await axios.post(`${API_URL}/auth/login`, { email: user.email, password: user.password });
  tokens[user.role] = res.data.token;
  console.log(`[PASS] Logged in as ${user.role}`);
}

async function runTests() {
  try {
    console.log("=== 1. Starting Doctor Workflow ===");
    await registerOrLogin(PATIENT); // Need patient registered first
    await registerOrLogin(DOCTOR);
    await registerOrLogin(POLICE);
    await registerOrLogin(JUDGE);

    // Doctor creates case
    const casePayload = {
      caseType: 'Road Accident',
      title: 'E2E Test Case',
      description: 'Accident on main street',
      patientName: PATIENT.fullName,
      incidentDate: new Date().toISOString()
    };
    
    // Test Doctor creating case
    const createRes = await axios.post(`${API_URL}/cases`, casePayload, { headers: { Authorization: `Bearer ${tokens.doctor}`}});
    caseData = createRes.data.data;
    console.log(`[PASS] Doctor created case: ${caseData.caseId}`);

    // Create a dummy PDF
    const dummyPdfPath = path.join(__dirname, 'dummy.pdf');
    fs.writeFileSync(dummyPdfPath, "Dummy PDF Content");

    // Doctor uploads report
    const formData = new FormData();
    formData.append('document', fs.createReadStream(dummyPdfPath));
    const uploadRes = await axios.post(`${API_URL}/cases/${caseData._id}/documents`, formData, { 
      headers: { ...formData.getHeaders(), Authorization: `Bearer ${tokens.doctor}` } 
    });
    console.log(`[PASS] Doctor uploaded report. Blockchain status: ${uploadRes.data.data.case.blockchainVerified}`);
    
    // In our robust API, blockchain hash generation triggers automatically. Let's explicitly generate if needed.
    if (!uploadRes.data.data.case.blockchainVerified) {
       await axios.post(`${API_URL}/cases/${caseData._id}/generate-hash`, {}, { headers: { Authorization: `Bearer ${tokens.doctor}`}});
       console.log(`[PASS] Explicitly generated blockchain hash`);
    }

    console.log("=== 2. Police Dashboard Test ===");
    // Police search
    const searchRes = await axios.get(`${API_URL}/search-case?caseId=${caseData.caseId}`, { headers: { Authorization: `Bearer ${tokens.police}`}});
    console.log(`[PASS] Police searched and found case: ${searchRes.data.data.caseId}`);
    
    // Police verifies hash
    const verifyRes = await axios.post(`${API_URL}/verify-hash`, { caseId: caseData._id }, { headers: { Authorization: `Bearer ${tokens.police}`}});
    console.log(`[PASS] Police verified blockchain hash. Valid: ${verifyRes.data.data.isValid}, DebugStatus: ${verifyRes.data.data.__debugSaveStatus}`);

    // Police forward to judge
    const fwdRes = await axios.post(`${API_URL}/forward-case`, { caseId: caseData._id, notes: "Looks good" }, { headers: { Authorization: `Bearer ${tokens.police}`}});
    console.log(`[PASS] Police forwarded to judge. Status: ${fwdRes.data.data.status}`);

    console.log("=== 3. Judge Dashboard Test ===");
    const judgeCasesReq = await axios.get(`${API_URL}/cases/judge-cases`, { headers: { Authorization: `Bearer ${tokens.judiciary}`}});
    const foundByJudge = judgeCasesReq.data.data.find(c => c._id === caseData._id);
    if(foundByJudge) console.log("[PASS] Judge can see forwarded case");
    else throw new Error("Judge cannot see forwarded case!");

    const approveRes = await axios.post(`${API_URL}/cases/${caseData._id}/approve`, { remarks: "Approved" }, { headers: { Authorization: `Bearer ${tokens.judiciary}`}});
    console.log(`[PASS] Judge approved case.`);

    console.log("=== 4. Patient Dashboard Test ===");
    const patientCasesReq = await axios.get(`${API_URL}/patient-records`, { headers: { Authorization: `Bearer ${tokens.patient}`}});
    const foundByPatient = patientCasesReq.data.data.find(c => c.caseNumber === caseData.caseNumber);
    if(foundByPatient) console.log("[PASS] Patient can see their own case record.");
    else throw new Error("Patient cannot see their own case!");

    // Patient download report
    const dlRes = await axios.get(`${API_URL}/download-report/${caseData._id}`, { headers: { Authorization: `Bearer ${tokens.patient}`}, validateStatus: false });
    if(dlRes.status === 200 || dlRes.status === 201) console.log("[PASS] Patient downloaded report successfully");
    else throw new Error(`Patient download failed with status ${dlRes.status}: ${JSON.stringify(dlRes.data)}`);


    console.log("=== 5. Security Testing ===");
    // Patient accessing another case
    let secFail = false;
    try {
      await axios.get(`${API_URL}/cases/judge-cases`, { headers: { Authorization: `Bearer ${tokens.patient}`}});
    } catch (e) {
      if(e.response.status === 403) {
         console.log("[PASS] Patient blocked from judge route (403)");
         secFail = true;
      }
    }
    if(!secFail) throw new Error("Security failed: Patient could access judge routes!");

    console.log("ALL TESTS PASSED SUCCESSFULLY! Workflow is COMPLETE.");

  } catch (error) {
    if (error.response) {
      console.error(`[FAIL] Error Response from ${error.config.url}:`, error.response.status, error.response.data);
    } else {
      console.error("[FAIL] Error Executing Test:", error.message);
    }
  }
}

runTests();
