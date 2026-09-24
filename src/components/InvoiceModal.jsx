import { useEffect } from 'react'
import styled from 'styled-components'
import { FaDownload, FaShareNodes, FaXmark } from 'react-icons/fa6'
import { formatPrice } from '../utils/format'
import { Button, SecondaryButton } from './ui'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
`

const Dialog = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
`

const Title = styled.h2`
  margin: 0;
  font-size: 1.05rem;
  color: var(--color-text);
`

const Subtitle = styled.span`
  font-size: 0.8rem;
  color: var(--color-text-muted);
`

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 50%;
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-border);
    color: var(--color-text);
  }
`

const Preview = styled.div`
  overflow-y: auto;
  padding: 1.5rem;
  background: var(--color-bg);
`

const Brand = styled.div`
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
`

const BrandTag = styled.div`
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
`

const HeadRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`

const HeadRight = styled.div`
  text-align: right;
`

const InvoiceTitle = styled.div`
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-text);
`

const InvoiceCode = styled.div`
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
`

const Rule = styled.div`
  height: 2px;
  margin: 1rem 0;
  background: var(--color-primary);
  border-radius: 1px;
`

const SectionLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--color-text);
`

const ClientName = styled.div`
  margin-top: 0.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
`

const ClientMeta = styled.div`
  margin-top: 0.125rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
`

const Table = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
`

const TableHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
`

const RowName = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
`

const RowMeta = styled.div`
  margin-top: 0.125rem;
  font-size: 0.72rem;
  color: var(--color-text-muted);
`

const RowPrice = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
`

const TotalRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-text);
`

const DiscountRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.375rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-success);
`

const Thanks = styled.div`
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
`

const Actions = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
`

const money = (value) => (value != null ? formatPrice(value) : '—')

function InvoiceModal({ data, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const invoice = data?.data

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = data.url
    link.download = data.filename
    link.click()
  }

  const handleShare = async () => {
    const file = new File([data.blob], data.filename, {
      type: 'application/pdf',
    })
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Factura Benis' })
      } else if (navigator.share) {
        await navigator.share({
          title: 'Factura Benis',
          text: `Factura Nº ${data.code}`,
        })
      } else {
        handleDownload()
      }
    } catch (err) {
      if (err?.name !== 'AbortError') console.error(err)
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <div>
            <Title>Factura</Title>
            <Subtitle>Comprobante Nº {data.code}</Subtitle>
          </div>
          <CloseButton type="button" onClick={onClose} aria-label="Cerrar">
            <FaXmark size={16} />
          </CloseButton>
        </Header>

        <Preview>
          {invoice ? (
            <>
              <HeadRow>
                <div>
                  <Brand>Benis</Brand>
                  <BrandTag>Tu centro de belleza</BrandTag>
                </div>
                <HeadRight>
                  <InvoiceTitle>Factura</InvoiceTitle>
                  <InvoiceCode>Comprobante Nº {invoice.code}</InvoiceCode>
                </HeadRight>
              </HeadRow>

              <Rule />

              <SectionLabel>Cliente</SectionLabel>
              <ClientName>{invoice.clientName}</ClientName>
              <ClientMeta>{invoice.contact || '—'}</ClientMeta>

              <Table>
                <TableHead>
                  <span>Servicio</span>
                  <span>Precio</span>
                </TableHead>
                {invoice.services.map((service, index) => (
                  <Row key={index}>
                    <div>
                      <RowName>{service.name}</RowName>
                      <RowMeta>
                        {[invoice.date, service.time, service.duration]
                          .filter(Boolean)
                          .join(' · ')}
                      </RowMeta>
                    </div>
                    <RowPrice>{money(service.price)}</RowPrice>
                  </Row>
                ))}
              </Table>

              {invoice.discountAmount > 0 && (
                <DiscountRow>
                  <span>
                    Descuento
                    {invoice.discountTitle ? ` ${invoice.discountTitle}` : ''}
                    {invoice.discountPercent != null
                      ? ` (${invoice.discountPercent}%)`
                      : ''}
                  </span>
                  <span>-{money(invoice.discountAmount)}</span>
                </DiscountRow>
              )}

              <TotalRow>
                <span>Total</span>
                <span>{money(invoice.total)}</span>
              </TotalRow>

              <Thanks>Gracias por confiar en Benis.</Thanks>
            </>
          ) : null}
        </Preview>

        <Actions>
          <Button type="button" onClick={handleShare} style={{ flex: 1 }}>
            <FaShareNodes size={15} />
            Compartir
          </Button>
          <SecondaryButton
            type="button"
            onClick={handleDownload}
            style={{ flex: 1 }}
          >
            <FaDownload size={15} />
            Descargar
          </SecondaryButton>
        </Actions>
      </Dialog>
    </Overlay>
  )
}

export default InvoiceModal
