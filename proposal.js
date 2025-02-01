// Word count functionality
const projectDescription = document.getElementById('projectDescription');
const wordCount = document.getElementById('wordCount');

projectDescription.addEventListener('input', () => {
    const words = projectDescription.value.trim().split(/\s+/).length;
    wordCount.textContent = words;
});

// Enable/disable grade select based on checkbox
const specificGradesCheckbox = document.getElementById('ben2');
const gradeSelect = document.getElementById('gradeSelect');

specificGradesCheckbox.addEventListener('change', () => {
    gradeSelect.disabled = !specificGradesCheckbox.checked;
});

// Custom goal functionality
const goalsGroup = document.getElementById('goalsGroup');
const addCustomGoal = document.getElementById('addCustomGoal');
const customGoalInput = document.getElementById('customGoal');

addCustomGoal.addEventListener('click', () => {
    const customGoalText = customGoalInput.value.trim();
    if (customGoalText) {
        const customId = `goal${Date.now()}`;
        const newGoal = document.createElement('div');
        newGoal.className = 'checkbox-item';
        newGoal.innerHTML = `
            <input type="checkbox" id="${customId}" name="goals" value="custom" checked>
            <label for="${customId}">${customGoalText}</label>
        `;
        goalsGroup.insertBefore(newGoal, goalsGroup.lastElementChild);
        customGoalInput.value = '';
    }
});

// Custom beneficiary functionality
const beneficiariesGroup = document.getElementById('beneficiariesGroup');
const addCustomBeneficiary = document.getElementById('addCustomBeneficiary');
const customBeneficiaryInput = document.getElementById('customBeneficiary');

addCustomBeneficiary.addEventListener('click', () => {
    const customBeneficiaryText = customBeneficiaryInput.value.trim();
    if (customBeneficiaryText) {
        const customId = `ben${Date.now()}`;
        const newBeneficiary = document.createElement('div');
        newBeneficiary.className = 'checkbox-item';
        newBeneficiary.innerHTML = `
            <input type="checkbox" id="${customId}" name="beneficiaries" value="custom" checked>
            <label for="${customId}">${customBeneficiaryText}</label>
        `;
        beneficiariesGroup.insertBefore(newBeneficiary, beneficiariesGroup.lastElementChild);
        customBeneficiaryInput.value = '';
    }
});

// Custom outcome functionality
const outcomesGroup = document.getElementById('outcomesGroup');
const addCustomOutcome = document.getElementById('addCustomOutcome');
const customOutcomeInput = document.getElementById('customOutcome');

addCustomOutcome.addEventListener('click', () => {
    const customOutcomeText = customOutcomeInput.value.trim();
    if (customOutcomeText) {
        const customId = `out${Date.now()}`;
        const newOutcome = document.createElement('div');
        newOutcome.className = 'checkbox-item';
        newOutcome.innerHTML = `
            <input type="checkbox" id="${customId}" name="outcomes" value="custom" checked>
            <label for="${customId}">${customOutcomeText}</label>
        `;
        outcomesGroup.insertBefore(newOutcome, outcomesGroup.lastElementChild);
        customOutcomeInput.value = '';
    }
});

// Form submission
const proposalForm = document.getElementById('proposalForm');

proposalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Collect form data
    const formData = {
        grantType: document.getElementById('grantType').value,
        projectTitle: document.getElementById('projectTitle').value,
        projectDescription: document.getElementById('projectDescription').value,
        goals: Array.from(document.querySelectorAll('input[name="goals"]:checked')).map(input => input.labels[0].textContent),
        beneficiaries: Array.from(document.querySelectorAll('input[name="beneficiaries"]:checked')).map(input => {
            if (input.id === 'ben2' && !gradeSelect.disabled) {
                return `Specific grade levels: ${gradeSelect.options[gradeSelect.selectedIndex].text}`;
            }
            return input.labels[0].textContent;
        }),
        outcomes: Array.from(document.querySelectorAll('input[name="outcomes"]:checked')).map(input => input.labels[0].textContent)
    };

    // Here you would typically send the data to a server
    console.log('Form Data:', formData);
    
    // For demonstration, show success message
    alert('Proposal created successfully! Check the console for the form data.');
    
    // Optionally reset the form
    proposalForm.reset();
}); 