import { useEffect } from 'react'
import styled from 'styled-components'
import { FaDownload, FaFilePdf, FaShareNodes, FaXmark } from 'react-icons/fa6'
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
  height: 62vh;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }
`

const Actions = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
`

const Fallback = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
`

const FallbackTitle = styled.p`
  margin: 0;
  font-weight: 700;
  color: var(--color-text);
`

const FallbackText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
`

function canPreviewPdf() {
  if (typeof navigator === 'undefined') return false
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  if (isMobile) return false
  if (typeof navigator.pdfViewerEnabled === 'boolean') {
    return navigator.pdfViewerEnabled
  }
  return true
}

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

  const canPreview = canPreviewPdf()

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
          {canPreview ? (
            <iframe src={data.url} title="Vista previa de la factura" />
          ) : (
            <Fallback>
              <FaFilePdf size={42} color="var(--color-primary)" />
              <FallbackTitle>La factura está lista</FallbackTitle>
              <FallbackText>
                Tu navegador no puede mostrar la vista previa del PDF. Usá
                “Descargar” para abrirlo o “Compartir” para enviarlo.
              </FallbackText>
            </Fallback>
          )}
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
