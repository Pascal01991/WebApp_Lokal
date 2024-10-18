document.addEventListener('DOMContentLoaded', function () {
    const calendarBody = document.getElementById('calendarBody');
    const hoursInDay = 24;
    const daysInWeek = 7;

    // Create rows for each hour
    for (let hour = 0; hour < hoursInDay; hour++) {
        const row = document.createElement('div');
        row.classList.add('calendar-row');

        // First column: hours (e.g., 1:00, 2:00, etc.)
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
});

document.addEventListener('DOMContentLoaded', function () {
    const calendarBody = document.getElementById('calendarBody');
    const hoursInDay = 24;
    const daysInWeek = 7;
    let startHour = 9;
    let endHour = 19;

    // Function to render the calendar
    function renderCalendar() {
        calendarBody.innerHTML = ''; // Clear previous content

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
    }

    // Initial render
    renderCalendar();

    // Settings modal logic
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeBtn = document.querySelector('.close');
    const applySettingsBtn = document.getElementById('applySettings');

    settingsBtn.onclick = function () {
        settingsModal.style.display = "block";
    }

    closeBtn.onclick = function () {
        settingsModal.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == settingsModal) {
            settingsModal.style.display = "none";
        }
    }

    // Apply settings button
    applySettingsBtn.onclick = function () {
        const newStartHour = parseInt(document.getElementById('startHour').value, 10);
        const newEndHour = parseInt(document.getElementById('endHour').value, 10);

        if (newStartHour >= 0 && newEndHour <= 23 && newStartHour < newEndHour) {
            startHour = newStartHour;
            endHour = newEndHour;
            renderCalendar(); // Re-render the calendar
            settingsModal.style.display = "none"; // Close modal
        } else {
            alert("Bitte gültige Stunden angeben!");
        }
    }
});
