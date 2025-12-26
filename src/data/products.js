export const products = [
  {
    id: 1,
    name: "Arduino UNO Starter Kit",
    price: 6000,
    category: "DIY Kits",
    image: "https://via.placeholder.com/300x300?text=Arduino+UNO",
    description: "Complete Arduino UNO starter kit with tutorials and components",
    specifications: "ATmega328P, USB Type-B, 14 Digital I/O, 6 Analog Inputs",
    related: [2, 3, 4]
  },
  {
    id: 2,
    name: "Raspberry Pi 4 Kit",
    price: 8500,
    category: "DIY Kits",
    image: "https://via.placeholder.com/300x300?text=Raspberry+Pi4",
    description: "Powerful single-board computer kit for IoT and automation projects",
    specifications: "4GB RAM, Quad-core ARM, Wi-Fi, Bluetooth, 4K HDMI",
    related: [1, 5, 6]
  },
  {
    id: 3,
    name: "GSM/GPRS SIM800C Module",
    price: 1200,
    category: "Electronics Components",
    image: "https://via.placeholder.com/300x300?text=GSM+Module",
    description: "Quad-band GSM/GPRS module for global connectivity",
    specifications: "850/900/1800/1900 MHz, 5V, TTL Serial Interface",
    related: [1, 4, 7]
  },
  {
    id: 4,
    name: "Temperature & Humidity Sensor DHT22",
    price: 500,
    category: "Electronics Components",
    image: "https://via.placeholder.com/300x300?text=DHT22",
    description: "Accurate digital temperature and humidity sensor",
    specifications: "Range: -40 to 80°C, ±2% Humidity accuracy, 3.3-5V",
    related: [1, 3, 8]
  },
  {
    id: 5,
    name: "Smart Home Automation Kit",
    price: 8500,
    category: "IoT Solutions",
    image: "https://via.placeholder.com/300x300?text=Smart+Home",
    description: "Complete smart home kit with lighting, temperature control",
    specifications: "10+ compatible devices, WiFi enabled, Mobile app ready",
    related: [2, 6, 9]
  },
  {
    id: 6,
    name: "Industrial Power Supply 24V 10A",
    price: 3500,
    category: "Electrical",
    image: "https://via.placeholder.com/300x300?text=Power+Supply",
    description: "Reliable industrial-grade power supply for automation systems",
    specifications: "24V DC, 10A, 240W, CE certified, Short circuit protection",
    related: [2, 5, 10]
  },
  {
    id: 7,
    name: "PCB Prototyping Kit",
    price: 2000,
    category: "DIY Kits",
    image: "https://via.placeholder.com/300x300?text=PCB+Kit",
    description: "Professional PCB design and prototyping materials",
    specifications: "100 copper boards, etching chemicals, drilling tools",
    related: [1, 3, 4]
  },
  {
    id: 8,
    name: "Stepper Motor NEMA 17",
    price: 1500,
    category: "Electronics Components",
    image: "https://via.placeholder.com/300x300?text=Stepper+Motor",
    description: "High-precision stepper motor for CNC and 3D printing",
    specifications: "1.5A per phase, 0.9° step angle, 48mm frame",
    related: [4, 6, 11]
  },
  {
    id: 9,
    name: "Biomedical Pulse Oximeter Sensor",
    price: 2500,
    category: "Biomedical",
    image: "https://via.placeholder.com/300x300?text=Oximeter",
    description: "MAX30102 pulse oximeter for heart rate and oxygen monitoring",
    specifications: "I2C interface, ±2% accuracy, 3.3V logic, 14-bit resolution",
    related: [5, 10, 12]
  },
  {
    id: 10,
    name: "Industrial Relay Module 4-Channel",
    price: 1200,
    category: "Electrical",
    image: "https://via.placeholder.com/300x300?text=Relay+Module",
    description: "4-channel 5V relay module for industrial applications",
    specifications: "10A per channel, 250VAC, Optically isolated, 3.3-5V control",
    related: [6, 8, 9]
  },
  {
    id: 11,
    name: "CNC Router Spindle Motor Kit",
    price: 12000,
    category: "Equipment",
    image: "https://via.placeholder.com/300x300?text=CNC+Spindle",
    description: "Complete CNC spindle motor kit with controller",
    specifications: "800W, 12000 RPM, ER11 collet, water cooling ready",
    related: [8, 10, 14]
  },
  {
    id: 12,
    name: "Patient Monitoring System",
    price: 25000,
    category: "Biomedical",
    image: "https://via.placeholder.com/300x300?text=Monitoring",
    description: "Complete biomedical patient monitoring with cloud integration",
    specifications: "ECG, SpO2, Blood Pressure, Wireless connectivity",
    related: [9, 13, 15]
  },
  {
    id: 13,
    name: "Industrial IoT Gateway",
    price: 8000,
    category: "IoT Solutions",
    image: "https://via.placeholder.com/300x300?text=IoT+Gateway",
    description: "Edge computing gateway for industrial IoT applications",
    specifications: "Dual Ethernet, 4G LTE, 16GB storage, Linux OS",
    related: [5, 12, 14]
  },
  {
    id: 14,
    name: "Advanced Graphics Design Course",
    price: 5000,
    category: "Training",
    image: "https://via.placeholder.com/300x300?text=Design+Course",
    description: "Comprehensive graphics design course - UI/UX and branding",
    specifications: "8 weeks, live sessions, projects included, certificate",
    related: [15, 16, 18]
  },
  {
    id: 15,
    name: "Web Development Professional Course",
    price: 7500,
    category: "Training",
    image: "https://via.placeholder.com/300x300?text=Web+Dev",
    description: "Full-stack web development with React, Node.js, and more",
    specifications: "12 weeks, hands-on projects, job support, lifetime access",
    related: [14, 16, 17]
  },
  {
    id: 16,
    name: "Student Project Consultation Package",
    price: 3000,
    category: "Services",
    image: "https://via.placeholder.com/300x300?text=Consultation",
    description: "1-on-1 project consultation and guidance for students",
    specifications: "4 sessions, 1 hour each, custom solutions, mentoring",
    related: [14, 15, 18]
  },
  {
    id: 17,
    name: "Embedded Systems Bootcamp",
    price: 6000,
    category: "Training",
    image: "https://via.placeholder.com/300x300?text=Embedded",
    description: "Intensive embedded systems programming bootcamp",
    specifications: "6 weeks, C/C++ programming, microcontroller focus",
    related: [15, 18, 19]
  },
  {
    id: 18,
    name: "Proteus SPICE Design Workshop",
    price: 2500,
    category: "Training",
    image: "https://via.placeholder.com/300x300?text=Proteus",
    description: "Professional circuit design with Proteus and SPICE simulations",
    specifications: "3 weeks, practical simulations, certification",
    related: [16, 17, 20]
  },
  {
    id: 19,
    name: "PCB Design Professional Certification",
    price: 4500,
    category: "Training",
    image: "https://via.placeholder.com/300x300?text=PCB+Design",
    description: "Complete PCB design and manufacturing workflow training",
    specifications: "KiCAD/Eagle software, design rules, fabrication",
    related: [17, 18, 20]
  },
  {
    id: 20,
    name: "IoT System Integration Course",
    price: 5500,
    category: "Training",
    image: "https://via.placeholder.com/300x300?text=IoT+Course",
    description: "End-to-end IoT system design and cloud integration",
    specifications: "8 weeks, AWS/Azure, MQTT, real-world projects",
    related: [19, 17, 15]
  }
];

export const tutorials = [
  {
    id: 1,
    title: "Getting Started with Arduino",
    excerpt: "Learn the basics of Arduino programming and hardware setup",
    category: "Arduino",
    thumbnail: "https://via.placeholder.com/400x250?text=Arduino+Guide",
    content: "Complete guide to setting up your first Arduino project..."
  },
  {
    id: 2,
    title: "GSM Module Communication",
    excerpt: "Send SMS and make calls using GSM modules with Arduino",
    category: "GSM",
    thumbnail: "https://via.placeholder.com/400x250?text=GSM",
    content: "Learn how to integrate GSM modules for IoT connectivity..."
  },
  {
    id: 3,
    title: "Sensor Integration Guide",
    excerpt: "Connect and read data from various sensors",
    category: "Sensors",
    thumbnail: "https://via.placeholder.com/400x250?text=Sensors",
    content: "Comprehensive tutorial on sensor interfacing and data logging..."
  },
  {
    id: 4,
    title: "IoT with Raspberry Pi",
    excerpt: "Build complete IoT projects using Raspberry Pi",
    category: "IoT",
    thumbnail: "https://via.placeholder.com/400x250?text=IoT",
    content: "Step-by-step guide to IoT development with Python and Node.js..."
  },
  {
    id: 5,
    title: "Proteus Circuit Simulation",
    excerpt: "Design and simulate circuits before building them",
    category: "Proteus",
    thumbnail: "https://via.placeholder.com/400x250?text=Proteus",
    content: "Learn SPICE simulation and PCB layout in Proteus..."
  },
  {
    id: 6,
    title: "Smart Home Automation",
    excerpt: "Create your own smart home system from scratch",
    category: "Smart Home",
    thumbnail: "https://via.placeholder.com/400x250?text=Smart+Home",
    content: "Build wireless smart home automation systems..."
  }
];

export const services = [
  {
    id: 1,
    title: "Electrical Installation & Repair",
    description: "Professional electrical installation, maintenance, and repair services for residential and commercial properties",
    icon: "Zap",
    features: ["Circuit design", "Safety inspection", "Fault diagnosis", "Emergency repairs"],
    price: "Quotation based"
  },
  {
    id: 2,
    title: "Biomedical Engineering",
    description: "Equipment servicing, calibration, and maintenance for medical devices and diagnostic equipment",
    icon: "Heart",
    features: ["Device maintenance", "Calibration", "Training", "Compliance audits"],
    price: "Quotation based"
  },
  {
    id: 3,
    title: "Web Development & Graphics Design",
    description: "Custom website development, mobile apps, and professional graphics design services",
    icon: "Code",
    features: ["Responsive design", "Custom development", "SEO optimization", "UI/UX design"],
    price: "Quotation based"
  },
  {
    id: 4,
    title: "Automation & IoT Solutions",
    description: "Design and implementation of automation and IoT systems for industrial and smart applications",
    icon: "Settings",
    features: ["System design", "Hardware integration", "Cloud setup", "24/7 monitoring"],
    price: "Quotation based"
  },
  {
    id: 5,
    title: "Student Project Assistance",
    description: "Consultation, coding help, and simulation support for student projects across all engineering disciplines",
    icon: "BookOpen",
    features: ["Project guidance", "Code review", "Simulations", "Documentation"],
    price: "KSh 3,000+"
  },
  {
    id: 6,
    title: "AutoCAD Floor Plan Drawings",
    description: "Professional AutoCAD floor plan drawings, electrical layout plans, and site drawings in DWG/DXF formats",
    icon: "Settings",
    features: ["DWG/DXF deliverables", "Electrical layout drawings", "As-built revisions", "Site measurement support"],
    price: "Quotation based"
  }
];

export const testimonials = [
  {
    name: "John Kipchoge",
    role: "Electrical Engineer",
    comment: "PK Automations helped us complete our automation project on time with excellent quality. Highly recommended!",
    avatar: "/pk-automations-logo-thumb.webp"
  },
  {
    name: "Grace Murugi",
    role: "Biomedical Student",
    comment: "Their student project assistance was invaluable. They helped me understand complex concepts easily.",
    avatar: "/pk-automations-logo-thumb.webp"
  },
  {
    name: "James Okonkwo",
    role: "Business Owner",
    comment: "The web development team created an amazing website for our business. Professional and responsive!",
    avatar: "/pk-automations-logo-thumb.webp"
  },
  {
    name: "Patricia Wanjiru",
    role: "Industrial Manager",
    comment: "Their IoT solutions increased our production efficiency by 40%. Great technical support throughout.",
    avatar: "/pk-automations-logo-thumb.webp"
  }
];
