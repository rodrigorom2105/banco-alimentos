export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type WelcomeSlide = {
  id: string;
  title: string;
  description: string;
  image: number;
};
