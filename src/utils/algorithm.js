function calculateScore(studentGrades, requiredSubjects) {
  let total = 0;
  let count = 0;

  for (const subject of requiredSubjects) {
    if (studentGrades[subject] !== undefined) {
      total += studentGrades[subject];
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}
function rankStudents(students, seats) {
  const sorted = students.sort((a, b) => b.score - a.score);

  return sorted.map((student, idx) => ({
    ...student,
    result: idx < seats ? "accepted" : "waitlisted"
  }));
}
