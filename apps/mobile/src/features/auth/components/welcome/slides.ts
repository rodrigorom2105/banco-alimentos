import type { WelcomeSlide } from '../../types';

export const slides: WelcomeSlide[] = [
  {
    id: '1',
    title: 'BAMX Conecta',
    description:
      'Dona, encuentra centros de acopio y ayuda a combatir la inseguridad alimentaria en Jalisco',
    image: require('@/assets/images/auth/dona.png'),
  },
  {
    id: '2',
    title: 'Encuentra dónde donar',
    description:
      'Explora el mapa y encuentra el centro de acopio o campaña activa más cercana a ti',
    image: require('@/assets/images/auth/encuentra.png'),
  },
  {
    id: '3',
    title: 'Dona desde casa',
    description:
      'Si no puedes trasladarte, solicita que un voluntario verificado recoja tu donativo',
    image: require('@/assets/images/auth/donar.png'),
  },
  {
    id: '4',
    title: 'Sé voluntario',
    description: 'Regístrate, verifica tu identidad y ayuda a recolectar donativos en tu zona',
    image: require('@/assets/images/auth/voluntario.png'),
  },
  {
    id: '5',
    title: 'Regístrate o inicia sesión',
    description: '',
    image: require('@/assets/images/auth/getstarted.png'),
  },
];
