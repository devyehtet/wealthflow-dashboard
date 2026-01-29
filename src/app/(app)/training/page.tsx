import { prisma } from "@/lib/prisma";

export default async function TrainingPage() {
  const [courses, students, enrollments] = await Promise.all([
    prisma.course.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.student.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.enrollment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { student: true, course: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Training</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Courses, students, enrollments, and partial payment tracking.
        </p>
      </header>

      {/* Add Course */}
      <section className="space-y-3">
        <h2 className="font-semibold">Add Course</h2>
        <form
          action="/api/courses"
          method="POST"
          className="rounded-2xl border p-4 grid gap-3 md:grid-cols-4 bg-white dark:bg-black"
        >
          <input
            name="title"
            placeholder="Course title"
            className="rounded-xl border p-3"
            required
          />
          <input
            name="batch"
            placeholder="Batch/Week (e.g. Batch 2)"
            className="rounded-xl border p-3"
            required
          />
          <select
            name="feeCurrency"
            className="rounded-xl border p-3"
            defaultValue="MMK"
          >
            <option value="THB">THB</option>
            <option value="MMK">MMK</option>
            <option value="USD">USD</option>
          </select>
          <input
            name="feeAmount"
            type="number"
            step="0.01"
            placeholder="Fee amount"
            className="rounded-xl border p-3"
            required
          />
          <button
            type="submit"
            className="rounded-xl border p-3 hover:bg-black hover:text-white md:col-span-4"
          >
            Create Course
          </button>
        </form>
      </section>

      {/* Add Student */}
      <section className="space-y-3">
        <h2 className="font-semibold">Add Student</h2>
        <form
          action="/api/students"
          method="POST"
          className="rounded-2xl border p-4 grid gap-3 md:grid-cols-4 bg-white dark:bg-black"
        >
          <input
            name="name"
            placeholder="Name"
            className="rounded-xl border p-3"
            required
          />
          <input
            name="email"
            placeholder="Email (optional)"
            className="rounded-xl border p-3"
          />
          <input
            name="viberPhone"
            placeholder="Viber phone (optional)"
            className="rounded-xl border p-3"
          />
          <button
            type="submit"
            className="rounded-xl border p-3 hover:bg-black hover:text-white"
          >
            Add Student
          </button>
        </form>
      </section>

      {/* Enroll */}
      <section className="space-y-3">
        <h2 className="font-semibold">Enroll Student + Payment Plan</h2>
        <form
          action="/api/enroll"
          method="POST"
          className="rounded-2xl border p-4 grid gap-3 md:grid-cols-6 bg-white dark:bg-black"
        >
          <select name="studentId" className="rounded-xl border p-3" required>
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select name="courseId" className="rounded-xl border p-3" required>
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} • {c.batch}
              </option>
            ))}
          </select>

          <select
            name="totalCurrency"
            className="rounded-xl border p-3"
            defaultValue="MMK"
          >
            <option value="THB">THB</option>
            <option value="MMK">MMK</option>
            <option value="USD">USD</option>
          </select>

          <input
            name="totalAmount"
            type="number"
            step="0.01"
            placeholder="Total fee"
            className="rounded-xl border p-3"
            required
          />
          <input
            name="rate"
            type="number"
            step="0.0001"
            placeholder="Rate to THB (if not THB)"
            className="rounded-xl border p-3"
          />

          <button
            type="submit"
            className="rounded-xl border p-3 hover:bg-black hover:text-white"
          >
            Enroll
          </button>
        </form>

        <p className="text-xs text-zinc-500">
          Enrollment creates the total fee record. Then you can add partial
          payments later.
        </p>
      </section>

      {/* Lists */}
      <section className="space-y-6">
        {/* Courses List */}
        <div className="rounded-2xl border p-4 bg-white dark:bg-black">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Courses</h3>
            <span className="text-xs text-zinc-500">{courses.length} shown</span>
          </div>

          <div className="mt-3 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500">
                <tr>
                  <th className="py-2">Title</th>
                  <th>Batch</th>
                  <th>Fee</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2">{c.title}</td>
                    <td>{c.batch}</td>
                    <td>
                      {Number(c.feeAmount).toFixed(2)} {c.feeCurrency}
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td className="py-3 text-zinc-500" colSpan={3}>
                      No courses yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Students List */}
        <div className="rounded-2xl border p-4 bg-white dark:bg-black">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Students</h3>
            <span className="text-xs text-zinc-500">{students.length} shown</span>
          </div>

          <div className="mt-3 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500">
                <tr>
                  <th className="py-2">Name</th>
                  <th>Email</th>
                  <th>Viber</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2">{s.name}</td>
                    <td>{s.email ?? "-"}</td>
                    <td>{s.viberPhone ?? "-"}</td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td className="py-3 text-zinc-500" colSpan={3}>
                      No students yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enrollments List */}
        <div className="rounded-2xl border p-4 bg-white dark:bg-black">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Enrollments</h3>
            <span className="text-xs text-zinc-500">
              {enrollments.length} shown
            </span>
          </div>

          <div className="mt-3 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500">
                <tr>
                  <th className="py-2">Student</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="py-2">{e.student.name}</td>
                    <td>{e.course.title}</td>
                    <td>{e.batch}</td>
                    <td>
                      {Number(e.totalFeeAmount).toFixed(2)} {e.totalFeeCurrency}
                    </td>
                    <td>{e.status}</td>
                  </tr>
                ))}
                {enrollments.length === 0 && (
                  <tr>
                    <td className="py-3 text-zinc-500" colSpan={5}>
                      No enrollments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
