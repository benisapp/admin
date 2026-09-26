import { jsPDF } from 'jspdf'
import { formatDateLong, formatTime12h } from './dates'
import { formatDuration, formatPrice } from './format'

function getTicketCode(appointment) {
  const id = appointment?.id || ''
  return id.slice(-6).toUpperCase()
}

const COLORS = {
  rose: [183, 110, 121],
  roseDeep: [142, 74, 85],
  roseLight: [212, 160, 166],
  blush: [243, 230, 231],
  ink: [51, 38, 43],
  muted: [140, 122, 128],
  border: [224, 205, 201],
  white: [255, 255, 255],
}

function money(value) {
  return value != null ? formatPrice(value) : '—'
}

function drawRoundedRect(doc, x, y, w, h, r) {
  doc.roundedRect(x, y, w, h, r, r, 'F')
}

export function buildInvoiceData({ client, items, discount }) {
  const list = items?.length ? items : []
  const firstAppt = list[0]?.appointment
  const code = getTicketCode(firstAppt) || '—'
  const clientName = client?.name || 'Cliente'
  const contact = [client?.phone, client?.email].filter(Boolean).join(' · ')
  const date = firstAppt?.date ? formatDateLong(firstAppt.date) : '—'
  const addons = Array.isArray(firstAppt?.addons)
    ? firstAppt.addons.filter(Boolean)
    : []
  const servicesSubtotal = list.reduce(
    (sum, item) => sum + (Number(item.service?.price) || 0),
    0,
  )
  const addonsSubtotal = addons.reduce((sum, addon) => {
    const quantity = Number(addon.quantity)
    const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1
    return sum + (Number(addon.price) || 0) * qty
  }, 0)
  const subtotal = servicesSubtotal + addonsSubtotal
  const discountPercent = discount?.percent ?? null
  const discountAmount =
    discountPercent != null ? Math.round((subtotal * discountPercent) / 100) : 0
  const total = subtotal - discountAmount
  const services = [
    ...list.map((item) => ({
      name: item.service?.name || 'Servicio',
      price: item.service?.price,
      time: item.appointment?.startTime
        ? `${formatTime12h(item.appointment.startTime)} - ${formatTime12h(item.appointment.endTime)}`
        : null,
      duration: item.service?.duration
        ? formatDuration(item.service.duration)
        : null,
    })),
    ...addons.map((addon) => {
      const quantity = Number(addon.quantity)
      const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1
      return {
        name: `Adicional · ${addon.name || 'Adicional'}${qty > 1 ? ` ×${qty}` : ''}`,
        price: (Number(addon.price) || 0) * qty,
        time: null,
        duration:
          Number(addon.duration) > 0
            ? formatDuration(Number(addon.duration) * qty)
            : null,
        isAddon: true,
      }
    }),
  ]

  return {
    code,
    clientName,
    contact,
    date,
    subtotal,
    discountAmount,
    discountTitle: discount?.title || null,
    discountPercent,
    total,
    services,
  }
}

function buildInvoiceDoc({ client, items, discount }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const margin = 16

  const { code, clientName, contact, date, discountAmount, discountTitle, discountPercent, total, services } =
    buildInvoiceData({
      client,
      items,
      discount,
    })

  doc.setTextColor(...COLORS.rose)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  doc.text('Benis', margin, 23)

  doc.setFontSize(11)
  doc.setTextColor(...COLORS.muted)
  doc.setFont('helvetica', 'normal')
  doc.text('Tu centro de belleza', margin, 33)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(...COLORS.ink)
  doc.text('Factura', W - margin, 24, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.muted)
  doc.text(`Comprobante Nº ${code}`, W - margin, 34, { align: 'right' })

  doc.setDrawColor(...COLORS.rose)
  doc.setLineWidth(0.8)
  doc.line(margin, 40, W - margin, 40)

  let y = 56

  doc.setTextColor(...COLORS.ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Cliente', margin, y)
  y += 8

  doc.setFontSize(11)
  doc.text(clientName, margin, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.muted)
  doc.setFontSize(10)
  doc.text(contact || '—', margin, y)
  y += 14

  doc.setTextColor(...COLORS.ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Detalle', margin, y)
  y += 4

  doc.setFillColor(...COLORS.rose)
  drawRoundedRect(doc, margin, y, W - margin * 2, 10, 2)
  doc.setTextColor(...COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('SERVICIO', margin + 5, y + 6.5)
  doc.text('PRECIO', W - margin - 5, y + 6.5, { align: 'right' })
  y += 10

  doc.setLineWidth(0.3)

  services.forEach((service) => {
    const meta = [date, service.time, service.duration].filter(Boolean).join('  ·  ')

    doc.setTextColor(...COLORS.ink)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(service.name, margin + 5, y + 7)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(money(service.price), W - margin - 5, y + 7, {
      align: 'right',
    })

    if (meta) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.muted)
      doc.setFontSize(9)
      doc.text(meta, margin + 5, y + 13)
    }

    y += 19
    doc.setDrawColor(...COLORS.border)
    doc.line(margin, y, W - margin, y)
    y += 1
  })

  y += 11

  if (discountAmount > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...COLORS.roseDeep)
    doc.text(
      `Descuento (${discountTitle || discountPercent + '%'})`,
      margin,
      y,
    )
    doc.text(`-${money(discountAmount)}`, W - margin, y, { align: 'right' })
    y += 8
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...COLORS.ink)
  doc.text('Total', margin, y)
  doc.text(money(total), W - margin, y, { align: 'right' })

  y += 16
  doc.setDrawColor(...COLORS.border)
  doc.line(margin, y, W - margin, y)
  y += 14

  doc.setTextColor(...COLORS.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Gracias por confiar en Benis.', W / 2, y, { align: 'center' })

  return doc
}

export function generateInvoice({ client, items, discount }) {
  const data = buildInvoiceData({ client, items, discount })
  const doc = buildInvoiceDoc({ client, items, discount })
  const filename = `factura-benis-${data.code}.pdf`
  const blob = doc.output('blob')
  return { blob, code: data.code, filename, data }
}
