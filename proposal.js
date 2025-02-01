document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('proposalForm');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const progressFill = document.querySelector('.progress-fill');
    const prevButton = document.querySelector('.prev-step');
    const nextButton = document.querySelector('.next-step');
    const stepIndicator = document.querySelector('.step-indicator');
    let currentStep = 0;

    // Initialize the form
    function initForm() {
        showStep(currentStep);
        updateNavigation();
        updateProgress();
    }

    // Show the current step
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.classList.remove('active');
            if (index === stepIndex) {
                step.classList.add('active');
            }
        });
        updateStepIndicator();
    }

    // Update navigation buttons
    function updateNavigation() {
        prevButton.disabled = currentStep === 0;
        nextButton.textContent = currentStep === steps.length - 1 ? 'Submit' : 'Next';
    }

    // Update progress bar
    function updateProgress() {
        const progress = ((currentStep + 1) / steps.length) * 100;
        progressFill.style.width = `${progress}%`;
    }

    // Update step indicator text
    function updateStepIndicator() {
        stepIndicator.textContent = `Step ${currentStep + 1} of ${steps.length}`;
    }

    // Validate current step
    function validateStep(stepIndex) {
        const currentStepElement = steps[stepIndex];
        const inputs = currentStepElement.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        // Special validation for word count if it's the project description step
        const projectDescription = currentStepElement.querySelector('#projectDescription');
        if (projectDescription) {
            const wordCount = projectDescription.value.trim().split(/\s+/).length;
            if (wordCount < 100 || wordCount > 500) {
                isValid = false;
                projectDescription.classList.add('error');
            }
        }

        return isValid;
    }

    // Handle next button click
    nextButton.addEventListener('click', () => {
        if (currentStep === steps.length - 1) {
            // Submit form
            if (validateStep(currentStep)) {
                submitForm();
            }
        } else {
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
                updateNavigation();
                updateProgress();
            }
        }
    });

    // Handle previous button click
    prevButton.addEventListener('click', () => {
        currentStep--;
        showStep(currentStep);
        updateNavigation();
        updateProgress();
    });

    // Word count functionality
    const projectDescription = document.getElementById('projectDescription');
    const wordCount = document.getElementById('wordCount');

    if (projectDescription && wordCount) {
        projectDescription.addEventListener('input', () => {
            const words = projectDescription.value.trim().split(/\s+/).length;
            wordCount.textContent = `${words} words`;
            if (words < 100 || words > 500) {
                wordCount.classList.add('error');
            } else {
                wordCount.classList.remove('error');
            }
        });
    }

    // Grade selection functionality
    const specificGradesCheckbox = document.getElementById('specificGradesCheckbox');
    const gradeSelect = document.getElementById('gradeSelect');

    if (specificGradesCheckbox && gradeSelect) {
        specificGradesCheckbox.addEventListener('change', () => {
            gradeSelect.disabled = !specificGradesCheckbox.checked;
        });
    }

    // Submit form function
    function submitForm() {
        // Collect all form data
        const formData = {
            grantType: document.getElementById('grantType').value,
            projectTitle: document.getElementById('projectTitle').value,
            projectDescription: document.getElementById('projectDescription').value,
            goals: Array.from(document.querySelectorAll('input[name="goals"]:checked')).map(cb => cb.value),
            beneficiaries: Array.from(document.querySelectorAll('input[name="beneficiaries"]:checked')).map(cb => cb.value),
            outcomes: Array.from(document.querySelectorAll('input[name="outcomes"]:checked')).map(cb => cb.value),
            specificGrades: specificGradesCheckbox.checked ? gradeSelect.value : 'All grades'
        };

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <h3>Proposal Submitted Successfully!</h3>
            <p>Thank you for submitting your proposal. We will review it and get back to you soon.</p>
        `;

        form.innerHTML = '';
        form.appendChild(successMessage);

        // Log form data (replace with actual submission logic)
        console.log('Form submitted:', formData);
    }

    // Initialize the form
    initForm();
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