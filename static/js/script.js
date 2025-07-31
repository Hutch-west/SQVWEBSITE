document.addEventListener('DOMContentLoaded', function() {
    console.log("SCRIPT.JS VERSION: 2025-07-21-2000-A");
    const serviceMenuItems = document.querySelectorAll('.service-item'); // All clickable service links
    const additionalOptions = document.querySelectorAll('.additional-option'); // All additional checkboxes
    const selectedServicesList = document.getElementById('selectedServicesList');
    const noServiceSelectedMessage = document.getElementById('noServiceSelected');
    const numRoomsInput = document.getElementById('numRooms');
    const numBathroomsInput = document.getElementById('numBathrooms');
    const getEstimateBtn = document.getElementById('getEstimateBtn');
    const estimateResultDiv = document.getElementById('estimateResult'); // Renamed to avoid conflict
    const estimatedPriceDisplay = document.getElementById('estimatedPrice');
    const itemizedBreakdownDisplay = document.getElementById('itemizedBreakdown');
    const proceedToScheduleBtn = document.getElementById('proceedToScheduleBtn');

    // Data Storage
    let selectedServices = {}; // Stores serviceId: { name, base, perRoom, perBathroom, quantity }
    let selectedAdditionalOptions = {}; // Stores optionId: { name, price }

    // --- Core Calculation Logic ---
    function calculateEstimate() {
        let total = 0;
        let breakdown = [];

        const rooms = parseInt(numRoomsInput.value) || 0;
        const bathrooms = parseInt(numBathroomsInput.value) || 0;

        // Calculate for main services
        for (const serviceId in selectedServices) {
            const service = selectedServices[serviceId];
            let serviceCost = service.base; // Base price for the selected service
            
            if (service.perRoom > 0 && rooms > 0) {
                serviceCost += (rooms * service.perRoom);
                breakdown.push(`${service.name} (Rooms: ${rooms}): $${(rooms * service.perRoom).toFixed(2)}`);
            }
            if (service.perBathroom > 0 && bathrooms > 0) {
                serviceCost += (bathrooms * service.perBathroom);
                breakdown.push(`${service.name} (Bathrooms: ${bathrooms}): $${(bathrooms * service.perBathroom).toFixed(2)}`);
            }
            // Add base price to breakdown
            // Ensure base price is only added once per selected service in breakdown
            // We'll refine this for the final display on schedule page
            breakdown.unshift(`${service.name} (Base): $${service.base.toFixed(2)}`); 
            
            total += serviceCost;
        }
        
        // Calculate for additional options
        for (const optionId in selectedAdditionalOptions) {
            const option = selectedAdditionalOptions[optionId];
            total += option.price;
            breakdown.push(`${option.name}: $${option.price.toFixed(2)}`);
        }

        return { total: total, breakdown: breakdown, rooms: rooms, bathrooms: bathrooms }; // Added rooms and bathrooms to return
    }

    // --- Update UI ---
    function updateSelectedServicesUI() {
        selectedServicesList.innerHTML = ''; // Clear current list

        if (Object.keys(selectedServices).length === 0) {
            selectedServicesList.appendChild(noServiceSelectedMessage);
            noServiceSelectedMessage.style.display = 'list-item'; // Ensure it's visible
        } else {
            noServiceSelectedMessage.style.display = 'none'; // Hide the 'no services selected' message
            for (const serviceId in selectedServices) {
                const service = selectedServices[serviceId];
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                listItem.innerHTML = `
                    ${service.name}
                    <span class="remove-service" data-service-id="${serviceId}">&times;</span>
                `;
                selectedServicesList.appendChild(listItem);
            }
        }
        // Always trigger estimate update after service changes
        updateEstimateDisplay();
    }

    function updateEstimateDisplay() {
        const { total, breakdown } = calculateEstimate();
        estimatedPriceDisplay.textContent = `$${total.toFixed(2)}`;
        itemizedBreakdownDisplay.innerHTML = breakdown.join('<br>'); // Display itemized breakdown
        
        // Show/hide estimate result div
        if (Object.keys(selectedServices).length > 0 || Object.keys(selectedAdditionalOptions).length > 0) {
             estimateResultDiv.classList.remove('hidden');
        } else {
             estimateResultDiv.classList.add('hidden');
        }
    }


    // --- Event Listeners ---

    // 1. Service Menu Item Clicks (Left Column)
    serviceMenuItems.forEach(item => {
        item.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link behavior

            const serviceId = this.dataset.serviceId;
            const serviceName = this.dataset.serviceName;
            const basePrice = parseFloat(this.dataset.basePrice);
            const perRoom = parseFloat(this.dataset.perRoom);
            const perBathroom = parseFloat(this.dataset.perBathroom);

            // Toggle selection logic: allow only one main service for simplicity
            // If you want multiple services, you'd modify this
            if (selectedServices[serviceId]) {
                // If already selected, deselect it
                delete selectedServices[serviceId];
                this.classList.remove('selected');
            } else {
                // Deselect any previously selected main service
                serviceMenuItems.forEach(sItem => sItem.classList.remove('selected'));
                selectedServices = {}; // Clear all previous main services

                // Select the new service
                selectedServices[serviceId] = { 
                    name: serviceName, 
                    base: basePrice, 
                    perRoom: perRoom, 
                    perBathroom: perBathroom 
                };
                this.classList.add('selected');
            }
            updateSelectedServicesUI();
        });
    });

    // 2. Remove Service from Selected List (Right Column) - Event Delegation
    selectedServicesList.addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-service')) {
            const serviceIdToRemove = event.target.dataset.serviceId;
            delete selectedServices[serviceIdToRemove];

            // Also unselect from the left menu
            serviceMenuItems.forEach(item => {
                if (item.dataset.serviceId === serviceIdToRemove) {
                    item.classList.remove('selected');
                }
            });
            updateSelectedServicesUI();
        }
    });

    // 3. Additional Options Checkbox Changes
    additionalOptions.forEach(option => {
        option.addEventListener('change', function() {
            const optionId = this.id; // e.g., 'petFriendly'
            const optionName = this.labels[0].textContent.split('(')[0].trim(); // Get text before (add $X)
            const optionPrice = parseFloat(this.dataset.price);

            if (this.checked) {
                selectedAdditionalOptions[optionId] = { name: optionName, price: optionPrice };
            } else {
                delete selectedAdditionalOptions[optionId];
            }
            updateEstimateDisplay(); // Update estimate immediately
        });
    });

    // 4. Rooms and Bathrooms Input Changes
    numRoomsInput.addEventListener('input', updateEstimateDisplay);
    numBathroomsInput.addEventListener('input', updateEstimateDisplay);

    // 5. Get Estimate Button Click
    getEstimateBtn.addEventListener('click', updateEstimateDisplay); // Already handled by input changes, but keep for explicit button click

    // 6. Proceed to Schedule Button Click - MODIFIED HERE
    proceedToScheduleBtn.addEventListener('click', function() {
        const scheduleUrl = this.dataset.scheduleUrl;
        if (scheduleUrl) {
            // Calculate final estimate and collect all data
            const { total, breakdown, rooms, bathrooms } = calculateEstimate();

            // Prepare data for session storage
            const dataToPass = {
                totalPrice: total,
                selectedServices: selectedServices, // Object with service details
                selectedAdditionalOptions: selectedAdditionalOptions, // Object with additional option details
                numRooms: rooms,
                numBathrooms: bathrooms,
                itemizedBreakdown: breakdown // For displaying on scheduling page
            };

            // Store data in session storage
            // Convert the JavaScript object to a JSON string before storing
            sessionStorage.setItem('cleaningEstimateData', JSON.stringify(dataToPass));

            // Navigate to the scheduling page
            window.location.href = scheduleUrl;
        } else {
            console.error("Scheduling URL not found on button's data-schedule-url attribute.");
            alert("Could not find scheduling page. Please try again later.");
        }
    });

    // Initial UI update on page load
    updateSelectedServicesUI(); // Initialize the selected services list
});