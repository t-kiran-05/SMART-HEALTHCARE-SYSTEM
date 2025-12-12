'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, appointmentAPI, notificationAPI } from '@/lib/api';
import { Calendar, Clock, User, LogOut, Bell, Plus, X } from 'lucide-react';

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    doctorId: '',
    doctorName: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [userRes, appointmentsRes, doctorsRes] = await Promise.all([
        authAPI.getCurrentUser(),
        appointmentAPI.getAll(),
        authAPI.getDoctors(),
      ]);

      setUser(userRes.user);
      setAppointments(appointmentsRes.appointments);
      setDoctors(doctorsRes.doctors);

      try {
        const notifRes = await notificationAPI.getNotifications(userRes.user.id, 'patient');
        setNotifications(notifRes.notifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
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

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await appointmentAPI.create(formData);
      setShowBookingForm(false);
      setFormData({ doctorId: '', doctorName: '', appointmentDate: '', appointmentTime: '', reason: '' });
      fetchData();
      alert('Appointment booked successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentAPI.cancel(id);
      fetchData();
      alert('Appointment cancelled successfully');
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
              <div className="p-2 bg-blue-600 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Patient Dashboard</h1>
                <p className="text-gray-600">{user?.fullName}</p>
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Appointments</p>
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
                <p className="text-gray-600 text-sm">Notifications</p>
                <p className="text-3xl font-bold text-green-600">{notifications.filter(n => !n.read).length}</p>
              </div>
              <Bell className="w-12 h-12 text-green-600" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <button onClick={() => setShowBookingForm(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
            <Plus className="w-5 h-5" />
            Book New Appointment
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">My Appointments</h2>
          </div>
          <div className="divide-y">
            {appointments.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-600">No appointments yet. Book your first appointment!</div>
            ) : (
              appointments.map((appointment) => (
                <div key={appointment.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Dr. {appointment.doctorName}</h3>
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
                        {appointment.notes && <p className="mt-2 text-blue-600"><strong>Doctor's Notes:</strong> {appointment.notes}</p>}
                      </div>
                    </div>
                    {appointment.status === 'pending' && (
                      <button onClick={() => handleCancelAppointment(appointment.id)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Book Appointment</h2>
              <button onClick={() => setShowBookingForm(false)}><X className="w-6 h-6 text-gray-600" /></button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
                <select
                  required
                  value={formData.doctorId}
                  onChange={(e) => {
                    const doctor = doctors.find(d => d.id === e.target.value);
                    setFormData({ ...formData, doctorId: e.target.value, doctorName: doctor?.fullName || '' });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>Dr. {doctor.fullName} - {doctor.specialization}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  required
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe your symptoms or reason for visit"
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                Book Appointment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}