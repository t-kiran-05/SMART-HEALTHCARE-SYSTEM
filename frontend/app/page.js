import Link from 'next/link';
import { Calendar, Shield, Bell, Users, Clock, CheckCircle, Heart } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">HealthCare</span>
            </div>
            <div className="flex gap-4">
              <Link href="/login" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium">
                Login
              </Link>
              <Link href="/register" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Healthcare Appointments
            <span className="block text-blue-600 mt-2">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with healthcare professionals instantly. Book, manage, and track your medical appointments all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg shadow-lg">
              Start Booking Now
            </Link>
            <Link href="/login" className="px-8 py-4 bg-white text-gray-800 rounded-lg hover:bg-gray-50 font-semibold text-lg border-2 border-gray-200">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our Platform?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mb-4 inline-flex">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Scheduling</h3>
              <p className="text-gray-600">Book appointments with your preferred doctors in just a few clicks</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg mb-4 inline-flex">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600">Your medical information is protected with enterprise-grade security</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mb-4 inline-flex">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Notifications</h3>
              <p className="text-gray-600">Get instant updates about your appointments and status changes</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 HealthCare System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}