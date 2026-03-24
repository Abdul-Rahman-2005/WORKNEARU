export interface Worker {
  id: string;
  name: string;
  phone: string;
  phone2?: string;
  category: string;
  experience: number;
  description: string;
  city: string;
  pincode: string;
  state: string;
  image: string;
  rating: number;
  totalReviews: number;
  status: 'active' | 'inactive';
  verified: boolean;
  createdAt: string;
}

export const CATEGORY_KEYS = [
  'electrician', 'plumber', 'carpenter',
  'ac_technician', 'refrigerator_repair', 'washing_machine_repair', 'tv_repair',
  'car_mechanic', 'bike_mechanic', 'auto_electrician',
  'mason', 'painter', 'tile_worker', 'welder',
  'house_cleaner', 'office_cleaner',
  'security_guard',
  'driver', 'delivery_worker',
] as const;

export const CATEGORY_GROUPS = {
  home_repair: ['electrician', 'plumber', 'carpenter'],
  appliance_repair: ['ac_technician', 'refrigerator_repair', 'washing_machine_repair', 'tv_repair'],
  vehicle_services: ['car_mechanic', 'bike_mechanic', 'auto_electrician'],
  construction: ['mason', 'painter', 'tile_worker', 'welder'],
  cleaning: ['house_cleaner', 'office_cleaner'],
  security: ['security_guard'],
  transport: ['driver', 'delivery_worker'],
};

const names = [
  'Ravi Kumar', 'Suresh Reddy', 'Venkat Rao', 'Ramesh Babu', 'Srinivas Goud',
  'Mahesh Singh', 'Anil Prasad', 'Kiran Yadav', 'Rajesh Sharma', 'Prakash Naidu',
  'Gopal Das', 'Manoj Patel', 'Vijay Verma', 'Deepak Gupta', 'Santosh Mishra',
];

const cities = [
  { city: 'Hyderabad', pincode: '500001', state: 'Telangana' },
  { city: 'Warangal', pincode: '506001', state: 'Telangana' },
  { city: 'Vijayawada', pincode: '520001', state: 'Andhra Pradesh' },
  { city: 'Delhi', pincode: '110001', state: 'Delhi' },
  { city: 'Mumbai', pincode: '400001', state: 'Maharashtra' },
];

export const mockWorkers: Worker[] = names.map((name, i) => {
  const loc = cities[i % cities.length];
  const cat = CATEGORY_KEYS[i % CATEGORY_KEYS.length];
  return {
    id: `w${i + 1}`,
    name,
    phone: `+91 ${9800000000 + i}`,
    phone2: i % 3 === 0 ? `+91 ${9700000000 + i}` : undefined,
    category: cat,
    experience: 2 + (i % 12),
    description: `Experienced ${cat.replace(/_/g, ' ')} with quality workmanship.`,
    ...loc,
    image: `https://api.dicebear.com/7.x/personas/svg?seed=${name.replace(/ /g, '')}`,
    rating: parseFloat((3.5 + (i % 3) * 0.5).toFixed(1)),
    totalReviews: 10 + i * 7,
    status: i % 5 === 0 ? 'inactive' as const : 'active' as const,
    verified: i % 3 === 0,
    createdAt: new Date(2024, i % 12, 1).toISOString(),
  };
});
