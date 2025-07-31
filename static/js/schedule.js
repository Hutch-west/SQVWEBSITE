// SQV/SQVWebpage/static/js/schedule.js

document.addEventListener('DOMContentLoaded', function() {
    console.log("SCHEDULE.JS VERSION: 2025-07-29-1200-A");

    // --- DOM Elements ---
    const schedulingServiceList = document.getElementById('schedulingServiceList');
    const schedulingNumRoomsInput = document.getElementById('schedulingNumRooms');
    const schedulingNumBathroomsInput = document.getElementById('schedulingNumBathrooms');
    const schedulingAdditionalOptionsDiv = document.getElementById('schedulingAdditionalOptions');
    const schedulingEstimatedPriceDisplay = document.getElementById('schedulingEstimatedPrice');
    const schedulingItemizedBreakdownDisplay = document.getElementById('schedulingItemizedBreakdown');

    const calendarElement = document.getElementById('calendar');
    const selectedDateInput = document.getElementById('selectedDate');
    const selectedTimeSelect = document.getElementById('selectedTime');

    const scheduleForm = document.getElementById('scheduleForm');
    const hiddenServicesData = document.getElementById('hiddenServicesData');
    const hiddenAdditionalOptionsData = document.getElementById('hiddenAdditionalOptionsData');
    const hiddenRooms = document.getElementById('hiddenRooms');
    const hiddenBathrooms = document.getElementById('hiddenBathrooms');
    const hiddenTotalPrice = document.getElementById('hiddenTotalPrice');
    const hiddenSelectedDate = document.getElementById('hiddenSelectedDate');
    const hiddenSelectedTime = document.getElementById('hiddenSelectedTime');

    // --- Data Storage (for this page's dynamic changes) ---
    // Initialize with data from session storage or default empty objects
    let originalEstimateData = JSON.parse(sessionStorage.getItem('cleaningEstimateData')) || {};
    let currentSelectedServices = originalEstimateData.selectedServices || {};
    let currentSelectedAdditionalOptions = originalEstimateData.selectedAdditionalOptions || {};
    let currentNumRooms = originalEstimateData.numRooms || 1;
    let currentNumBathrooms = originalEstimateData.numBathrooms || 1;

    // Set initial values for rooms/bathrooms inputs
    schedulingNumRoomsInput.value = currentNumRooms;
    schedulingNumBathroomsInput.value = currentNumBathrooms;

    // --- Service Definitions (duplicate from pricing.html's data-attributes for re-usability) ---
    // In a larger app, this might come from a central Django template context or API
    // For now, we'll hardcode them here to allow dynamic adding/removing on this page
    const allAvailableServices = {
        "standard": { name: "Standard Cleaning", base: 100, perRoom: 30, perBathroom: 20 },
        "deep": { name: "Deep Cleaning", base: 180, perRoom: 45, perBathroom: 30 },
        "moveInMoveOut": { name: "Move-in/Move-out Cleaning", base: 250, perRoom: 55, perBathroom: 40 },
        "postConstruction": { name: "Post-Construction Cleaning", base: 300, perRoom: 60, perBathroom: 45 }
    };

    const allAvailableAdditionalOptions = {
        "petFriendly": { name: "Pet-Friendly Cleaning", price: 50 },
        "ecoFriendly": { name: "Eco-Friendly Products", price: 20 }
    };

    // --- Calculation Logic (re-used from pricing page, adapted for current data) ---
    function calculateCurrentEstimate() {
        let total = 0;
        let breakdown = [];

        const rooms = parseInt(schedulingNumRoomsInput.value) || 0;
        const bathrooms = parseInt(schedulingNumBathroomsInput.value) || 0;

        // Calculate for main services
        for (const serviceId in currentSelectedServices) {
            const service = currentSelectedServices[serviceId]; // Use currentSelectedServices
            let serviceCost = service.base;
            
            if (service.perRoom > 0 && rooms > 0) {
                serviceCost += (rooms * service.perRoom);
                breakdown.push(`${service.name} (Rooms: ${rooms}): $${(rooms * service.perRoom).toFixed(2)}`);
            }
            if (service.perBathroom > 0 && bathrooms > 0) {
                serviceCost += (bathrooms * service.perBathroom);
                breakdown.push(`${service.name} (Bathrooms: ${bathrooms}): $${(bathrooms * service.perBathroom).toFixed(2)}`);
            }
            breakdown.push(`${service.name} (Base): $${service.base.toFixed(2)}`); // Add base price
            total += serviceCost;
        }
        
        // Calculate for additional options
        for (const optionId in currentSelectedAdditionalOptions) {
            const option = currentSelectedAdditionalOptions[optionId]; // Use currentSelectedAdditionalOptions
            total += option.price;
            breakdown.push(`${option.name}: $${option.price.toFixed(2)}`);
        }

        return { total: total, breakdown: breakdown, rooms: rooms, bathrooms: bathrooms };
    }

    // --- UI Update Functions ---
    function updateSchedulingUI() {
        schedulingServiceList.innerHTML = ''; // Clear current list

        if (Object.keys(currentSelectedServices).length === 0) {
            // Option to add service back if none selected
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item', 'text-muted');
            listItem.textContent = 'No main cleaning service selected. Please choose one:';
            schedulingServiceList.appendChild(listItem);

            // Add "Add Service" buttons
            for (const serviceId in allAvailableServices) {
                const service = allAvailableServices[serviceId];
                const serviceItem = document.createElement('li');
                serviceItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center', 'add-service-item');
                serviceItem.dataset.serviceId = serviceId; // Store service ID
                serviceItem.innerHTML = `
                    ${service.name} <span class="badge bg-secondary">$${service.base}+</span>
                    <button type="button" class="btn btn-sm btn-outline-primary add-service-btn" data-service-id="${serviceId}">Add</button>
                `;
                schedulingServiceList.appendChild(serviceItem);
            }
        } else {
            // Display currently selected services with remove option
            for (const serviceId in currentSelectedServices) {
                const service = currentSelectedServices[serviceId];
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                listItem.innerHTML = `
                    ${service.name}
                    <button type="button" class="btn btn-sm btn-outline-danger remove-service-btn" data-service-id="${serviceId}">&times; Remove</button>
                `;
                schedulingServiceList.appendChild(listItem);
            }
        }

        // Update Additional Options Checkboxes
        schedulingAdditionalOptionsDiv.innerHTML = '';
        for (const optionId in allAvailableAdditionalOptions) {
            const option = allAvailableAdditionalOptions[optionId];
            const isChecked = currentSelectedAdditionalOptions[optionId] ? 'checked' : '';
            schedulingAdditionalOptionsDiv.innerHTML += `
                <div class="form-check mt-2">
                    <input class="form-check-input additional-option-scheduling" type="checkbox" value="${optionId}" id="scheduling-${optionId}" data-price="${option.price}" ${isChecked}>
                    <label class="form-check-label" for="scheduling-${optionId}">
                        ${option.name} (add $${option.price})
                    </label>
                </div>
            `;
        }

        // Update the total display
        const { total, breakdown } = calculateCurrentEstimate();
        schedulingEstimatedPriceDisplay.textContent = `$${total.toFixed(2)}`;
        schedulingItemizedBreakdownDisplay.innerHTML = breakdown.join('<br>');
    }

    // --- Event Listeners for Dynamic Adjustments ---

    // Service add/remove logic using event delegation
    schedulingServiceList.addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-service-btn')) {
            const serviceIdToRemove = event.target.dataset.serviceId;
            delete currentSelectedServices[serviceIdToRemove];
            updateSchedulingUI();
        } else if (event.target.classList.contains('add-service-btn')) {
            const serviceIdToAdd = event.target.dataset.serviceId;
            const service = allAvailableServices[serviceIdToAdd];
            // Clear existing main service if any, as per pricing page's single selection
            currentSelectedServices = {}; 
            currentSelectedServices[serviceIdToAdd] = service;
            updateSchedulingUI();
        }
    });

    // Additional Options Checkbox Changes (Event delegation for dynamically added checkboxes)
    schedulingAdditionalOptionsDiv.addEventListener('change', function(event) {
        if (event.target.classList.contains('additional-option-scheduling')) {
            const optionId = event.target.value;
            const optionName = event.target.labels[0].textContent.split('(')[0].trim();
            const optionPrice = parseFloat(event.target.dataset.price);

            if (event.target.checked) {
                currentSelectedAdditionalOptions[optionId] = { name: optionName, price: optionPrice };
            } else {
                delete currentSelectedAdditionalOptions[optionId];
            }
            updateSchedulingUI();
        }
    });

    // Rooms and Bathrooms Input Changes
    schedulingNumRoomsInput.addEventListener('input', updateSchedulingUI);
    schedulingNumBathroomsInput.addEventListener('input', updateSchedulingUI);

    // --- Calendar & Time Slot Logic (Flatpickr) ---
    const fp = flatpickr(calendarElement, {
        inline: true, // Display calendar directly in the div
        minDate: "today",
        altInput: true,
        altFormat: "F j, Y",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr, instance) {
            selectedDateInput.value = dateStr; // Update the hidden input
            populateTimeSlots(dateStr); // Populate time slots based on selected date
        }
    });

    function populateTimeSlots(date) {
        // In a real application, you'd make an AJAX call here to your Django backend
        // to get available time slots for the selected 'date'.
        // For now, let's use some dummy slots.
        selectedTimeSelect.innerHTML = '<option value="">Select a time</option>'; // Clear existing options

        // Dummy available times (e.g., assuming 9 AM to 5 PM, every hour)
        const dummyTimes = [
            "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
            "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
        ];

        // Simulate some busy slots (e.g., random 2 slots per day might be busy)
        const busySlots = [];
        if (Math.random() > 0.5) { // Roughly half the time
            for(let i = 0; i < 2; i++) {
                busySlots.push(dummyTimes[Math.floor(Math.random() * dummyTimes.length)]);
            }
        }

        dummyTimes.forEach(time => {
            if (!busySlots.includes(time)) {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                selectedTimeSelect.appendChild(option);
            }
        });

        // If no slots available (e.g., if dummy logic makes all busy)
        if (selectedTimeSelect.options.length === 1) { // Only "Select a time" option
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No times available for this date";
            option.disabled = true;
            selectedTimeSelect.appendChild(option);
        }
    }

    // --- Form Submission Logic ---
    scheduleForm.addEventListener('submit', function(event) {
        // Client-side validation for date/time
        if (!selectedDateInput.value || !selectedTimeSelect.value) {
            alert('Please select a preferred date and time for your cleaning.');
            event.preventDefault(); // Stop form submission
            return;
        }

        if (Object.keys(currentSelectedServices).length === 0) {
            alert('Please select at least one main cleaning service.');
            event.preventDefault();
            return;
        }

        // Populate hidden fields before submission
        hiddenServicesData.value = JSON.stringify(currentSelectedServices);
        hiddenAdditionalOptionsData.value = JSON.stringify(currentSelectedAdditionalOptions);
        hiddenRooms.value = schedulingNumRoomsInput.value;
        hiddenBathrooms.value = schedulingNumBathroomsInput.value;
        hiddenTotalPrice.value = calculateCurrentEstimate().total.toFixed(2);
        hiddenSelectedDate.value = selectedDateInput.value;
        hiddenSelectedTime.value = selectedTimeSelect.value;

        // Optionally disable the submit button to prevent double submission
        // event.target.querySelector('button[type="submit"]').disabled = true;
    });

    // --- Initial Load ---
    updateSchedulingUI(); // Populate initial service list and price from session data
    // Do not pre-select a date in flatpickr, let the user choose.
});