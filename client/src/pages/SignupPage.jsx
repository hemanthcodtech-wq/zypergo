import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Package, Truck, Handshake, ArrowRight, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const roles = [
  {
    id: 'customer',
    title: 'Customer',
    description: 'Book, track, and manage your shipments',
    icon: <User strokeWidth={1.5} />,
    color: 'from-[#006D77] to-[#83C5BE]',
    bgIcon: 'text-[#006D77]/5',
    shadow: 'shadow-[0_10px_40px_-10px_rgba(0,109,119,0.3)]'
  },
  {
    id: 'hub',
    title: 'Hub Manager',
    description: 'Oversee operations and package sorting',
    icon: <Package strokeWidth={1.5} />,
    color: 'from-[#E29578] to-[#FFDDD2]',
    bgIcon: 'text-[#E29578]/5',
    shadow: 'shadow-[0_10px_40px_-10px_rgba(226,149,120,0.3)]'
  },
  {
    id: 'rider',
    title: 'Rider',
    description: 'Manage your pickup and delivery tasks',
    icon: <Truck strokeWidth={1.5} />,
    color: 'from-[#FFB703] to-[#FFD166]',
    bgIcon: 'text-[#FFB703]/5',
    shadow: 'shadow-[0_10px_40px_-10px_rgba(255,183,3,0.3)]'
  }
];

export default function SignupPage() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleRoleSelect = (roleId) => {
    sessionStorage.setItem('zypergo_portal', roleId);
    window.location.href = `/${roleId}/signup`;
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8F9FA] flex flex-col items-center justify-center font-sans overflow-hidden relative selection:bg-[#006D77] selection:text-white py-12">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-6">
            <UserPlus className="text-[#006D77] mr-2" size={20} />
            <span className="text-slate-700 font-bold tracking-widest uppercase text-sm">Join ZyperGo</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Create an <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#006D77] to-teal-400">Account</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Choose your role below to create your account and get started.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl perspective-1000">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, type: "spring", bounce: 0.2 }}
              onHoverStart={() => setHoveredCard(role.id)}
              onHoverEnd={() => setHoveredCard(null)}
              onClick={() => handleRoleSelect(role.id)}
              className="relative group cursor-pointer h-[320px] rounded-3xl preserve-3d"
            >
              <motion.div 
                className="absolute inset-0 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col justify-between p-8"
                animate={{
                  y: hoveredCard === role.id ? -10 : 0,
                  boxShadow: hoveredCard === role.id 
                    ? "0 25px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,109,119,0.1)" 
                    : "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className={`absolute -right-12 -bottom-12 w-64 h-64 ${role.bgIcon} opacity-40 transform transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12`}>
                  {React.cloneElement(role.icon, { size: 256 })}
                </div>

                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white mb-6 ${role.shadow} transform transition-transform duration-500 group-hover:scale-110`}>
                    {React.cloneElement(role.icon, { size: 28 })}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 mb-2 transition-colors">
                    {role.title}
                  </h3>
                  
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    {role.description}
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-[#006D77] transition-colors">Sign Up</span>
                  <motion.div 
                    className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400"
                    animate={{ 
                      x: hoveredCard === role.id ? 5 : 0,
                      backgroundColor: hoveredCard === role.id ? '#006D77' : '#F8F9FA',
                      color: hoveredCard === role.id ? '#FFFFFF' : '#94A3B8',
                      borderColor: hoveredCard === role.id ? '#006D77' : '#F1F5F9'
                    }}
                  >
                    <ArrowRight size={18} />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-500 font-medium">
            Already have an account? <Link to="/login" className="text-[#006D77] hover:text-[#00585f] font-bold ml-2 transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-[#006D77] after:origin-right after:scale-x-0 hover:after:scale-x-100 hover:after:origin-left after:transition-transform after:duration-300">Log in securely</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
