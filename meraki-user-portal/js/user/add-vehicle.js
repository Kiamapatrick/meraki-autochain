/* ============================================================
   MERAKI AUTOCHAIN — ADD VEHICLE
   Multi-step form wizard for vehicle registration
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Router.requireUser()) return;
  Auth.populateSidebar();

  const form = document.getElementById('add-vehicle-form');
  const steps = form.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const loadingOverlay = document.getElementById('form-loading');
  const successState = document.getElementById('success-state');
  const viewPassportBtn = document.getElementById('view-passport-btn');

  let currentStep = 1;
  let vehicleData = {};
  let createdMerakiId = null;

  // Navigation handlers
  document.getElementById('next-1')?.addEventListener('click', () => {
    if (validateStep(1)) { goToStep(2); }
  });
  document.getElementById('next-2')?.addEventListener('click', () => {
    if (validateStep(2)) { goToStep(3); }
  });
  document.getElementById('back-2')?.addEventListener('click', () => goToStep(1));
  document.getElementById('back-3')?.addEventListener('click', () => goToStep(2));

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validateStep(3)) {
      await submitVehicle();
    }
  });

  // View passport button
  viewPassportBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (createdMerakiId) {
      window.location.href = `vehicle-passport.html?id=${encodeURIComponent(createdMerakiId)}`;
    }
  });

  function goToStep(step) {
    if (step < 1 || step > 3) return;

    // Update step visibility
    steps.forEach(s => {
      const sNum = parseInt(s.dataset.step, 10);
      s.classList.toggle('active', sNum === step);
      s.hidden = sNum !== step;
    });

    // Update progress indicator
    progressSteps.forEach(ps => {
      const psNum = parseInt(ps.dataset.step, 10);
      ps.classList.toggle('active', psNum === step);
      ps.classList.toggle('completed', psNum < step);
    });

    // Update progressbar aria
    document.querySelector('.add-vehicle-progress').setAttribute('aria-valuenow', step);

    currentStep = step;

    // Update review step if going to step 3
    if (step === 3) populateReview();

    // Focus first input
    const activeStep = form.querySelector(`.form-step[data-step="${step}"]`);
    const firstInput = activeStep?.querySelector('input, select');
    firstInput?.focus();
  }

  function validateStep(step) {
    const activeStep = form.querySelector(`.form-step[data-step="${step}"]`);
    const inputs = activeStep?.querySelectorAll('input[required], select[required]');
    let valid = true;

    inputs?.forEach(input => {
      clearError(input);
      if (!input.value.trim()) {
        showError(input, 'This field is required');
        valid = false;
      }
    });

    // Additional validation for step 1
    if (step === 1) {
      const regNum = form.querySelector('#registrationNumber');
      if (regNum && regNum.value.trim() && !/^[A-Z]{1,3}\s?\d{1,4}[A-Z]?$/i.test(regNum.value.trim())) {
        showError(regNum, 'Invalid registration format (e.g. KDG 421C)');
        valid = false;
      }
    }

    // Year validation
    if (step === 1) {
      const year = form.querySelector('#year');
      if (year && year.value) {
        const y = parseInt(year.value, 10);
        if (y < 1900 || y > new Date().getFullYear() + 1) {
          showError(year, 'Year must be between 1900 and ' + (new Date().getFullYear() + 1));
          valid = false;
        }
      }
    }

    if (!valid) {
      Toast.error('Please fix the errors above');
    }

    return valid;
  }

  function showError(input, message) {
    input.classList.add('error');
    const errorEl = input.parentNode.querySelector('.form-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function clearError(input) {
    input.classList.remove('error');
    const errorEl = input.parentNode.querySelector('.form-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  function populateReview() {
    // Collect all form data
    const formData = new FormData(form);
    vehicleData = Object.fromEntries(formData);

    // Format for review display
    const fieldMap = {
      registrationNumber: 'registrationNumber',
      vin: 'vin',
      make: 'make',
      model: 'model',
      year: 'year',
      color: 'color',
      fuelType: 'fuelType',
      transmission: 'transmission',
      bodyType: 'bodyType',
      engineCapacity: 'engineCapacity'
    };

    Object.entries(fieldMap).forEach(([key, selector]) => {
      const valueEl = document.querySelector(`.review-value[data-field="${selector}"]`);
      if (valueEl) {
        const value = vehicleData[key]?.trim() || '';
        valueEl.textContent = value || '—';
        valueEl.classList.toggle('empty', !value);
      }
    });
  }

  async function submitVehicle() {
    // Prepare payload
    const payload = {
      registrationNumber: vehicleData.registrationNumber?.toUpperCase().replace(/\s+/g, ' '),
      vin: vehicleData.vin?.toUpperCase() || undefined,
      make: vehicleData.make?.trim(),
      model: vehicleData.model?.trim(),
      year: parseInt(vehicleData.year, 10),
      color: vehicleData.color?.trim() || undefined,
      fuelType: vehicleData.fuelType || undefined,
      transmission: vehicleData.transmission || undefined,
      bodyType: vehicleData.bodyType || undefined,
      engineCapacity: vehicleData.engineCapacity?.trim() || undefined
    };

    // Remove undefined values
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    // Show loading
    loadingOverlay.classList.remove('hidden');
    document.getElementById('submit-btn').disabled = true;

    try {
      const res = await API.vehicles.create(payload);
      createdMerakiId = res.vehicle?.merakiId;

      // Hide form, show success
      steps.forEach(s => { s.style.display = 'none'; });
      document.querySelector('.add-vehicle-progress').style.display = 'none';
      loadingOverlay.classList.add('hidden');
      successState.classList.remove('hidden');

      Toast.success('Vehicle registered successfully!');
    } catch (err) {
      loadingOverlay.classList.add('hidden');
      document.getElementById('submit-btn').disabled = false;

      if (err.status === 409) {
        Toast.error(err.message || 'Vehicle with this registration or VIN already exists');
      } else {
        Toast.error(err.message || 'Could not register vehicle. Please try again.');
      }
    }
  }

  // Clear errors on input
  form.querySelectorAll('.form-input, .form-input[type="number"], select').forEach(input => {
    input.addEventListener('input', () => clearError(input));
    input.addEventListener('change', () => clearError(input));
  });

  // Format registration number on blur
  const regInput = form.querySelector('#registrationNumber');
  if (regInput) {
    regInput.addEventListener('blur', () => {
      const val = regInput.value.trim().toUpperCase().replace(/\s+/g, ' ');
      // Format: KXX 000X
      const match = val.match(/^([A-Z]{1,3})\s?(\d{1,4})([A-Z]?)$/);
      if (match) {
        regInput.value = `${match[1]} ${match[2]}${match[3] || ''}`;
      }
    });
  }
});

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
}