'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, appointmentAPI } from '@/lib/api';
import { Calendar, Clock, User, LogOut, CheckCircle, XCircle } from 'lucide-react';

export default function DoctorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [userRes, appointmentsRes] = await Promise.all([
        authAPI.getCurrentUser(),
        appointmentAPI.getAll(),
      ]);

      setUser(userRes.user);
      setAppointments(appointmentsRes.appointments);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.message.includes('Unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await appointmentAPI.updateStatus(appointmentId, status, notes);
      setSelectedAppointment(null);
      setNotes('');
      fetchData();
      alert(`Appointment ${status} successfully!`);
    } catch (error) {
      alert(error.message);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-600 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h1>
                <p className="text-gray-600">Dr. {user?.fullName} - {user?.specialization}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-3xl font-bold text-gray-800">{appointments.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{appointments.filter(a => a.status === 'pending').length}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Approved</p>
                <p className="text-3xl font-bold text-green-600">{appointments.filter(a => a.status === 'approved').length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-blue-600">{appointments.filter(a => a.status === 'completed').length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Appointment Requests</h2>
          </div>
          <div className="divide-y">
            {appointments.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-600">No appointments yet.</div>
            ) : (
              appointments.map((appointment) => (
                <div key={appointment.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{appointment.patientName}</h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(appointment.appointmentDate).toLocaleDateString()}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {appointment.appointmentTime}
                        </p>
                        <p className="mt-2"><strong>Reason:</strong> {appointment.reason}</p>
                        {appointment.notes && <p className="mt-2 text-blue-600"><strong>Your Notes:</strong> {appointment.notes}</p>}
                      </div>
                    </div>
                    {appointment.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedAppointment(appointment)} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                          Review
                        </button>
                      </div>
                    )}
                    {appointment.status === 'approved' && (
                      <button onClick={() => { setSelectedAppointment(appointment); setNotes(''); }} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedAppointment.status === 'pending' ? 'Review Appointment' : 'Complete Appointment'}
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p><strong>Patient:</strong> {selectedAppointment.patientName}</p>
              <p><strong>Date:</strong> {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {selectedAppointment.appointmentTime}</p>
              <p><strong>Reason:</strong> {selectedAppointment.reason}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Add any notes for the patient..."
              />
            </div>

            <div className="flex gap-3">
              {selectedAppointment.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedAppointment.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAppointment.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                </>
              )}
              {selectedAppointment.status === 'approved' && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mark as Completed
                </button>
              )}
              <button
                onClick={() => { setSelectedAppointment(null); setNotes(''); }}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}