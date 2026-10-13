/**
 * Textos legales del voluntariado.
 *
 * ⚠️ BORRADOR. Los redactó el equipo de desarrollo tomando como guía la Ley Federal de
 * Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y lo que la app
 * realmente hace con los datos. NO los ha revisado el área legal de BAMX Guadalajara.
 * Antes de publicar la app hay que:
 *   1. pasarlos al área legal / de protección de datos de BAMX;
 *   2. confirmar la razón social, el domicilio y el correo del responsable;
 *   3. actualizar LAST_UPDATED y quitar IS_DRAFT.
 *
 * Mientras IS_DRAFT sea true, las pantallas muestran un aviso visible al usuario.
 */
export const IS_DRAFT = true;

export const LAST_UPDATED = 'octubre de 2026';

// Datos del responsable. ⚠️ Confirmar con BAMX antes de publicar.
const RESPONSIBLE = 'Banco de Alimentos de Guadalajara, A.C. ("BAMX Guadalajara")';
const CONTACT_EMAIL = 'privacidad@bamxguadalajara.org';

export type LegalDocument = {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
};

export const PRIVACY_NOTICE: LegalDocument = {
  title: 'Aviso de privacidad',
  intro: `${RESPONSIBLE}, con domicilio en Guadalajara, Jalisco, es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. Este aviso explica qué datos recabamos en BAMX Conecta, para qué los usamos y cómo puedes controlarlos.`,
  sections: [
    {
      heading: '1. Datos que recabamos',
      body: `Al crear tu cuenta: nombre, apellidos, correo electrónico y teléfono.

Si solicitas una recolección a domicilio: domicilio, referencias del lugar, coordenadas del punto de recolección, horario en que puedes recibir al voluntario y la descripción de lo que donas.

Si te registras como voluntario: una fotografía tuya, un comprobante de domicilio, los días y el horario en que estás disponible, y los municipios en los que puedes recoger donativos.`,
    },
    {
      heading: '2. Datos sensibles',
      body: `Tu fotografía y tu comprobante de domicilio se consideran datos personales que requieren tu consentimiento expreso. Al marcar la casilla de aceptación en el formulario de voluntariado, otorgas ese consentimiento. No recabamos datos de salud, origen étnico, creencias religiosas, afiliación política ni preferencias sexuales.`,
    },
    {
      heading: '3. Para qué usamos tus datos',
      body: `Finalidades necesarias:
• Operar tu cuenta y permitirte iniciar sesión.
• Coordinar la recolección de donativos: asignar un voluntario, calcular su ruta y comunicar a las partes lo necesario para el encuentro.
• Validar la identidad y el domicilio de quienes se registran como voluntarios, porque van a acudir al domicilio de otras personas.
• Llevar el registro de los donativos recibidos y entregados, para efectos de trazabilidad y rendición de cuentas.

No usamos tus datos para publicidad ni los vendemos.`,
    },
    {
      heading: '4. Quién puede ver tus datos',
      body: `• El personal autorizado de BAMX Guadalajara.
• El voluntario asignado a tu recolección puede ver tu nombre, tu teléfono y tu domicilio, y únicamente mientras la recolección está en curso.
• Como donante, puedes ver el nombre y la fotografía del voluntario asignado a tu recolección.
• Los documentos del voluntario (fotografía y comprobante de domicilio) solo los puede abrir él mismo y el personal autorizado de BAMX.

No compartimos tus datos con terceros, salvo que una autoridad competente nos lo requiera por escrito y conforme a la ley.`,
    },
    {
      heading: '5. Dónde se guardan',
      body: `Los datos se almacenan en la infraestructura de Supabase, nuestro proveedor de base de datos y almacenamiento de archivos, que puede operar servidores fuera de México. Los archivos (fotografías y comprobantes) se guardan en contenedores privados que requieren una autorización vigente para abrirse: no son accesibles con una dirección pública.`,
    },
    {
      heading: '6. Por cuánto tiempo',
      body: `Conservamos los datos de tu cuenta mientras la mantengas activa. Los registros de donativos y recolecciones se conservan de forma permanente para trazabilidad, pero pueden anonimizarse si solicitas la supresión de tus datos. Los documentos de voluntariado se conservan mientras seas voluntario activo y hasta dos años después, para atender aclaraciones.`,
    },
    {
      heading: '7. Tus derechos (ARCO)',
      body: `Puedes solicitar en cualquier momento:
• Acceso: saber qué datos tenemos sobre ti.
• Rectificación: corregirlos si están equivocados o incompletos.
• Cancelación: pedir que los eliminemos.
• Oposición: pedir que dejemos de usarlos para un fin determinado.

También puedes revocar tu consentimiento. Escríbenos a ${CONTACT_EMAIL} con tu nombre completo, el correo de tu cuenta y qué deseas solicitar. Te responderemos en un plazo máximo de 20 días hábiles.

Ten en cuenta que revocar el consentimiento sobre tu fotografía o tu comprobante de domicilio implica que ya no podrás participar como voluntario, porque son requisitos para acudir al domicilio de otras personas.`,
    },
    {
      heading: '8. Ubicación del dispositivo',
      body: `La app puede pedirte permiso para usar la ubicación de tu teléfono, con dos fines: mostrarte en el mapa qué centros de acopio tienes cerca y, si eres voluntario, calcular el orden de tus paradas del día. Puedes negar ese permiso y seguir usando la app; solo tendrás que escribir las direcciones a mano. No guardamos un historial de tus ubicaciones.`,
    },
    {
      heading: '9. Cambios a este aviso',
      body: `Si modificamos este aviso, publicaremos la nueva versión en esta misma pantalla y actualizaremos su fecha. Te recomendamos revisarla de vez en cuando.

Última actualización: ${LAST_UPDATED}.`,
    },
  ],
};

export const VOLUNTEER_TERMS: LegalDocument = {
  title: 'Términos del voluntariado',
  intro: `Estos términos aplican si decides participar como voluntario de recolección a domicilio en BAMX Conecta. Al marcar la casilla de aceptación, confirmas que los leíste y que estás de acuerdo.`,
  sections: [
    {
      heading: '1. El voluntariado es gratuito y libre',
      body: `Tu participación es voluntaria y no remunerada. No existe relación laboral, de subordinación ni de prestación de servicios entre tú y BAMX Guadalajara. Puedes dejar de participar en cualquier momento, sin necesidad de justificarlo.`,
    },
    {
      heading: '2. Requisitos',
      body: `• Ser mayor de edad.
• Proporcionar una fotografía tuya reciente y un comprobante de domicilio.
• Mantener un número de teléfono vigente en tu perfil.
• Indicar los municipios y el horario en que realmente puedes recoger donativos.

Tu solicitud queda sujeta a la revisión y aprobación de BAMX Guadalajara, que puede rechazarla o suspenderla sin que eso genere responsabilidad alguna.`,
    },
    {
      heading: '3. Tus compromisos al aceptar una recolección',
      body: `• Acudir al domicilio dentro del horario acordado, o cancelar con la mayor antelación posible si algo se presenta.
• Identificarte como voluntario de BAMX ante la persona que dona.
• Tratar a la persona que dona con respeto, y no solicitarle dinero, propinas, datos bancarios ni ningún otro bien.
• Registrar en la app la cantidad que realmente recibiste y la fotografía de evidencia.
• Entregar el donativo completo en el centro de acopio que la app te indique, el mismo día de la recolección.
• No consumir, vender, obsequiar ni desviar ninguna parte del donativo. Esto es una falta grave.`,
    },
    {
      heading: '4. Uso de los datos de las personas que donan',
      body: `Mientras una recolección está en curso podrás ver el nombre, el teléfono y el domicilio de quien dona. Esa información es confidencial y se te comparte con un único fin: realizar la recolección.

Te comprometes a no guardarla, copiarla, fotografiarla, difundirla ni usarla para contactar a esa persona por cualquier otro motivo. Hacerlo es causa de suspensión inmediata y puede tener consecuencias legales conforme a la LFPDPPP.`,
    },
    {
      heading: '5. Traslados y seguridad',
      body: `Los traslados los realizas por tu cuenta y bajo tu responsabilidad, con tu propio vehículo o medio de transporte. BAMX Guadalajara no cubre gastos de combustible, transporte, mantenimiento, multas ni daños, y no otorga un seguro por esta actividad.

Si una situación te parece insegura, no la enfrentes: cancela la recolección en la app e informa a BAMX. Tu seguridad está antes que cualquier donativo.`,
    },
    {
      heading: '6. Alimentos que no se deben recibir',
      body: `Recibe únicamente alimentos no perecederos, en su empaque original cerrado y sin daños. No recibas alimentos caducados, abiertos, preparados, refrigerados ni congelados, ni productos que no sean alimentos, salvo que BAMX te lo indique expresamente.

Si al llegar encuentras que el donativo no cumple, explícalo con amabilidad, registra en la app lo que sí recibiste y repórtalo.`,
    },
    {
      heading: '7. Suspensión',
      body: `BAMX Guadalajara puede suspender tu voluntariado, con un motivo registrado en la app, entre otros casos por: incumplir estos términos, cancelar recolecciones de forma reiterada sin causa, dar un trato inadecuado a quien dona, o hacer mal uso de los datos personales a los que tengas acceso.`,
    },
    {
      heading: '8. Límites de carga',
      body: `La plataforma te asigna recolecciones respetando un máximo de paradas y de kilómetros por día, para cuidar tu tiempo y tu seguridad. Si una asignación no te es posible, cancélala con el motivo y el sistema buscará a otro voluntario.`,
    },
    {
      heading: '9. Cambios a estos términos',
      body: `Si modificamos estos términos, publicaremos la nueva versión en esta pantalla y te lo haremos saber en la app. Si no estás de acuerdo con los cambios, puedes dejar de participar.

Última actualización: ${LAST_UPDATED}. Dudas: ${CONTACT_EMAIL}.`,
    },
  ],
};
