document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('proposalForm');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const progressFill = document.querySelector('.progress-fill');
    const prevButton = document.querySelector('.prev-step');
    const nextButton = document.querySelector('.next-step');
    const stepIndicator = document.querySelector('.step-indicator');
    let currentStep = 0;

    // Initialize the form
    // Updated 
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

            // Email validation for the email step
            if (input.type === 'email' && input.value.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value.trim())) {
                    isValid = false;
                    input.classList.add('error');
                    const errorMsg = document.createElement('p');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = 'Please enter a valid email address';
                    if (!input.nextElementSibling?.classList.contains('error-message')) {
                        input.parentNode.insertBefore(errorMsg, input.nextSibling);
                    }
                } else {
                    input.classList.remove('error');
                    const existingError = input.nextElementSibling;
                    if (existingError?.classList.contains('error-message')) {
                        existingError.remove();
                    }
                }
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
    async function submitForm() {
        // Collect all form data
        const formData = {
            origin: 'https://www.funding.org.nz/create-proposal.html',
            email: document.getElementById('userEmail').value,
            grantType: document.getElementById('grantType').value,
            projectTitle: document.getElementById('projectTitle').value,
            projectDescription: document.getElementById('projectDescription').value,
            goals: Array.from(document.querySelectorAll('input[name="goals"]:checked')).map(cb => ({
                id: cb.id,
                value: cb.value,
                label: cb.nextElementSibling.textContent.trim()
            })),
            beneficiaries: Array.from(document.querySelectorAll('input[name="beneficiaries"]:checked')).map(cb => ({
                id: cb.id,
                value: cb.value,
                label: cb.nextElementSibling.textContent.trim()
            })),
            outcomes: Array.from(document.querySelectorAll('input[name="outcomes"]:checked')).map(cb => ({
                id: cb.id,
                value: cb.value,
                label: cb.nextElementSibling.textContent.trim()
            })),
            specificGrades: specificGradesCheckbox.checked ? gradeSelect.value : 'All grades',
            submittedAt: new Date().toISOString()
        };

        // Show loading state
        nextButton.disabled = true;
        nextButton.textContent = 'Submitting...';

        try {
            // Fire and forget webhook
            fetch('https://hook.eu2.make.com/qh4mm3ml73o2icvrpqdcafirslrvonyu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            }).catch(error => console.log('Webhook error:', error)); // Just log any webhook errors

            // Show success message immediately
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            
            successMessage.innerHTML = `
                <h3>Congratulations on creating your first proposal!</h3>
                <p>To access this proposal, simply click the verification link in your email which will confirm your account.</p>
                <div class="email-verification-notice">
                    <p>We've sent a verification email to: <strong>${formData.email}</strong></p>
                    <p class="verification-hint">Please check your inbox and click the verification link to complete the process.</p>
                </div>
                <div class="success-actions" style="margin-top: 2rem;">
                    <button onclick="window.location.href='index.html'" class="nav-button">Return to Home</button>
                </div>
            `;

            // Add styles for the success message
            const style = document.createElement('style');
            style.textContent = `
                .success-message {
                    text-align: center;
                    padding: 2rem;
                }

                .success-message h3 {
                    color: #4169E1;
                    font-size: 1.8rem;
                    margin-bottom: 1rem;
                }

                .success-message p {
                    color: #1a1a1a;
                    opacity: 0.8;
                    font-size: 1.1rem;
                    line-height: 1.6;
                }

                .email-verification-notice {
                    margin: 2rem 0;
                    padding: 1.5rem;
                    background: #EEF2FF;
                    border-radius: 8px;
                }

                .verification-hint {
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                    color: #4169E1;
                }

                .success-actions {
                    margin-top: 2rem;
                }

                .success-actions .nav-button {
                    display: inline-block;
                    padding: 0.75rem 1.5rem;
                    background: #4169E1;
                    color: white;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }

                .success-actions .nav-button:hover {
                    background: #3451B2;
                    transform: translateY(-1px);
                }
            `;
            document.head.appendChild(style);

            form.innerHTML = '';
            form.appendChild(successMessage);

        } catch (error) {
            console.error('Error:', error);
            
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.innerHTML = `
                <h3>Submission Failed</h3>
                <p>There was an error submitting your proposal. Please try again later.</p>
                <button onclick="window.location.reload()" class="nav-button" style="margin-top: 1rem;">Try Again</button>
            `;

            // Re-enable submit button
            nextButton.disabled = false;
            nextButton.textContent = 'Submit';

            form.innerHTML = '';
            form.appendChild(errorMessage);
        }
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