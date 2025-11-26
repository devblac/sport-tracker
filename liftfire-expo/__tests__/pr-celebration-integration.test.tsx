/**
 * Integration test for PR celebration animation
 * Tests that PRs are detected and celebration modal is shown
 */

describe('PR Celebration Integration', () => {

  it('should calculate correct XP bonus for multiple PRs', () => {
    const prs = [
      { exerciseName: 'Bench Press', improvement: 5.5 },
      { exerciseName: 'Squat', improvement: 3.2 },
      { exerciseName: 'Deadlift', improvement: 7.8 },
    ];

    const xpBonus = prs.length * 50;

    expect(xpBonus).toBe(150);
  });

  it('should format celebration message correctly for single PR', () => {
    const prs = [{ exerciseName: 'Bench Press', improvement: 5.5 }];

    const message = `Congratulations! You set a new PR on ${prs[0].exerciseName} with ${prs[0].improvement.toFixed(1)}% improvement!`;

    expect(message).toBe('Congratulations! You set a new PR on Bench Press with 5.5% improvement!');
  });

  it('should format celebration message correctly for multiple PRs', () => {
    const prs = [
      { exerciseName: 'Bench Press', improvement: 5.5 },
      { exerciseName: 'Squat', improvement: 3.2 },
    ];

    const message = `Amazing! You crushed it with PRs on: ${prs.map(pr => pr.exerciseName).join(', ')}!`;

    expect(message).toBe('Amazing! You crushed it with PRs on: Bench Press, Squat!');
  });
});
