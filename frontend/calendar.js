document.addEventListener('DOMContentLoaded', function () {
    const calendarBody = document.getElementById('calendarBody');
    const calendarHeader = document.getElementById('calendarHeader');
    const daysInWeek = 7;
    let startHour = 9;
    let endHour = 19;

    // Get current date and set the current week
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Set to Monday of the current week

    // Fetch appointments from the server
    function fetchAppointments() {
        return fetch('http://localhost:5000/api/appointments') // Assuming the API endpoint is '/api/appointments'
            .then(response => response.json())
            .then(data => {
                console.log('Empfangene Termine:', data.appointments); // Log the appointments data
                return data.appointments;
            })
            .catch(error => {
                console.error('Fehler beim Abrufen der Termine:', error);
                return [];
            });
    }
    
    // Function to render the calendar
    function renderCalendar(appointments = []) {
        calendarBody.innerHTML = ''; // Clear previous content
        renderHeader(); // Update header dates

        // Create rows for each hour
        for (let hour = startHour; hour <= endHour; hour++) {
            const row = document.createElement('div');
            row.classList.add('calendar-row');

            // First column: hours (e.g., 9:00, 10:00, etc.)
            const hourCell = document.createElement('div');
            hourCell.classList.add('hour-cell');
            hourCell.textContent = `${hour}:00`;
            row.appendChild(hourCell);

            // Other columns: days of the week
            for (let day = 0; day < daysInWeek; day++) {
                const dayCell = document.createElement('div');
                dayCell.classList.add('day-cell');
                row.appendChild(dayCell);
            }

            calendarBody.appendChild(row);
        }

        displayAppointments(appointments); // Display appointments in the calendar
    }

    // Function to render header with dates
    function renderHeader() {
        const headers = calendarHeader.querySelectorAll('.day-header');
        let headerDate = new Date(currentDate); // Start with the current Monday

        headers.forEach(header => {
            const dateHeader = header.querySelector('.date-header');
            dateHeader.textContent = headerDate.toLocaleDateString(); // Display the date
            headerDate.setDate(headerDate.getDate() + 1); // Move to the next day
        });

        // Update current week display
        const startOfWeek = new Date(currentDate);
        const endOfWeek = new Date(currentDate);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        document.getElementById('currentWeek').textContent = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
    }

    // Function to display appointments in the calendar
    function displayAppointments(appointments) {
        appointments.forEach(app => {
            const appointmentDate = new Date(app.dateTime);
            const dayOfWeek = appointmentDate.getDay(); // Get day of week (0 for Sunday, 6 for Saturday)
            const hourOfDay = appointmentDate.getHours(); // Get the hour of the appointment
            const minutesOfDay = appointmentDate.getMinutes(); // Get the minutes

            // Convert Sunday (0) to last column (7)
            const calendarDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            if (hourOfDay >= startHour && hourOfDay <= endHour) {
                const durationInHours = app.duration / 60;
                const appointmentElement = document.createElement('div');
                appointmentElement.classList.add('appointment');
                appointmentElement.style.top = `${(minutesOfDay / 60) * 100}%`; // Adjust for minutes
                appointmentElement.style.height = `${durationInHours * 100}%`;

                appointmentElement.innerHTML = `
                    <h4>${app.description}</h4>
                    <p>${app.Vorname} ${app.Nachname}</p>
                    <p>${app.Dienstleistung}</p>
                `;

                // Find the correct day and hour cell
                const dayColumn = calendarBody.children[(hourOfDay - startHour) * daysInWeek + calendarDay + 1];
                dayColumn.appendChild(appointmentElement);
            }
        });
    }

    // Initial render: Fetch appointments and then render the calendar
    fetchAppointments().then(appointments => {
        renderCalendar(appointments);
    });

    // Settings modal logic
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeBtn = document.querySelector('.close');
    const applySettingsBtn = document.getElementById('applySettings');

    settingsBtn.onclick = function () {
        settingsModal.style.display = "block";
    };

    closeBtn.onclick = function () {
        settingsModal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target == settingsModal) {
            settingsModal.style.display = "none";
        }
    };

    // Apply settings button
    applySettingsBtn.onclick = function () {
        const newStartHour = parseInt(document.getElementById('startHour').value, 10);
        const newEndHour = parseInt(document.getElementById('endHour').value, 10);

        if (newStartHour >= 0 && newEndHour <= 23 && newStartHour < newEndHour) {
            startHour = newStartHour;
            endHour = newEndHour;
            fetchAppointments().then(appointments => {
                renderCalendar(appointments); // Re-render the calendar with new time range
            });
            settingsModal.style.display = "none"; // Close modal
        } else {
            alert("Bitte gültige Stunden angeben!");
        }
    };

    // Week navigation logic
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');

    prevWeekBtn.onclick = function () {
        currentDate.setDate(currentDate.getDate() - 7); // Go back one week
        fetchAppointments().then(appointments => {
            renderCalendar(appointments);
        });
    };

    nextWeekBtn.onclick = function () {
        currentDate.setDate(currentDate.getDate() + 7); // Go forward one week
        fetchAppointments().then(appointments => {
            renderCalendar(appointments);
        });
    };
});
