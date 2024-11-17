function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = ''; // Vorherigen Inhalt löschen

    // Startdatum (Montag) der aktuellen Woche erhalten
    const startOfWeek = getStartOfWeek(currentDate);

    // Tagesüberschriften erstellen
    calendar.appendChild(document.createElement('div')); // Leere Ecke für die Zeitspalte
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');
        dayHeader.textContent = getDayName(day) + ', ' + formatDate(day);
        calendar.appendChild(dayHeader);
    }

    // Zeitslots erstellen (Für Arbeitszeit)
    let earliestTime = '24:00';
    let latestTime = '00:00';
    Object.values(workingHours).forEach(day => {
        if (day.active) {
            if (day.morning.start && day.morning.start < earliestTime) earliestTime = day.morning.start;
            if (day.morning.end && day.morning.end > latestTime) latestTime = day.morning.end;
            if (day.afternoon.start && day.afternoon.start < earliestTime) earliestTime = day.afternoon.start;
            if (day.afternoon.end && day.afternoon.end > latestTime) latestTime = day.afternoon.end;
        }
    });

    // Konvertiere früheste und späteste Zeit in Stunden
    const startHour = parseInt(earliestTime.split(':')[0]);
    const endHour = parseInt(latestTime.split(':')[0]);

    // Erstelle Stundenzeilen
    for (let hour = startHour; hour <= endHour; hour++) {
        // Zeitlabel erstellen
        const timeLabel = document.createElement('div');
        timeLabel.classList.add('time-slot');
        timeLabel.textContent = (hour < 10 ? '0' + hour : hour) + ':00';
        calendar.appendChild(timeLabel);

        // Stundenfelder für jeden Tag
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dayName = getDayName(day).toLowerCase();

            const hourCell = document.createElement('div');
            hourCell.classList.add('hour-cell');
            hourCell.style.position = 'relative';

            // Überprüfen, ob der Tag aktiv ist
            if (workingHours[dayName].active) {
                // Überprüfen, ob der Slot innerhalb der Arbeitszeit liegt
                const slotTimeStart = new Date(day);
                slotTimeStart.setHours(hour, 0, 0, 0);

                const slotTimeEnd = new Date(day);
                slotTimeEnd.setHours(hour + 1, 0, 0, 0);

                const inWorkingHours = isWithinWorkingHours(slotTimeStart, workingHours[dayName]) || isWithinWorkingHours(slotTimeEnd, workingHours[dayName]);

                if (inWorkingHours) {
                    hourCell.classList.add('working-hour');
                } else {
                    hourCell.classList.add('non-working-hour');
                }
            } else {
                hourCell.classList.add('non-working-hour');
            }

            hourCell.dataset.dayIndex = i;
            hourCell.dataset.hour = hour;

            calendar.appendChild(hourCell);
        }
    }

    // Termine anzeigen
    displayAppointmentsOnCalendar();
}