/**
 * Clipboard service for handling copy operations
 * Provides robust copy functionality with fallback mechanisms
 */

export interface CopyResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CopyOptions {
  fallbackMethod?: boolean;
  timeout?: number;
}

/**
 * Primary copy method using the modern Clipboard API
 */
async function copyWithClipboardAPI(text: string, timeout: number = 5000): Promise<CopyResult> {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not available');
    }

    // Check for permissions first
    try {
      const permission = await navigator.permissions?.query({ name: 'clipboard-write' as PermissionName });
      if (permission && permission.state === 'denied') {
        throw new Error('Clipboard permission denied by user');
      }
    } catch (permError) {
      // Permissions API might not be available, continue anyway
      console.debug('Could not check clipboard permissions:', permError);
    }

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Clipboard operation timed out')), timeout);
    });

    // Race between clipboard write and timeout
    await Promise.race([
      navigator.clipboard.writeText(text),
      timeoutPromise
    ]);

    return {
      success: true,
      message: 'Text copied to clipboard successfully'
    };
  } catch (error) {
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Provide more user-friendly error messages
      if (error.message.includes('denied') || error.message.includes('permission')) {
        errorMessage = 'Clipboard access denied. Please allow clipboard permissions or try the manual copy method.';
      } else if (error.message.includes('not allowed') || error.message.includes('user agent')) {
        errorMessage = 'Clipboard access not allowed in this context. Please try clicking the copy button again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Copy operation timed out. Please try again.';
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Fallback copy method using the deprecated execCommand
 */
function copyWithExecCommand(text: string): CopyResult {
  try {
    // Check if execCommand is available
    if (!document.execCommand) {
      throw new Error('execCommand not available');
    }

    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Position it off-screen but ensure it's focusable
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.opacity = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('tabindex', '-1');
    textArea.setAttribute('aria-hidden', 'true');
    
    // Add to DOM
    document.body.appendChild(textArea);
    
    // Focus and select - critical for mobile browsers
    textArea.focus();
    textArea.select();
    
    // For mobile devices - ensure full selection
    if (textArea.setSelectionRange) {
      textArea.setSelectionRange(0, text.length);
    }
    
    // Attempt copy
    const successful = document.execCommand('copy');
    
    // Clean up immediately
    document.body.removeChild(textArea);
    
    if (successful) {
      return {
        success: true,
        message: 'Text copied to clipboard successfully (fallback method)'
      };
    } else {
      return {
        success: false,
        error: 'Browser does not support clipboard copy operation'
      };
    }
  } catch (error) {
    // Ensure cleanup even on error
    const textArea = document.querySelector('textarea[aria-hidden="true"]');
    if (textArea && textArea.parentNode) {
      textArea.parentNode.removeChild(textArea);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in fallback copy'
    };
  }
}

/**
 * Main copy function that tries modern API first, then falls back to execCommand
 */
export async function copyToClipboard(text: string, options: CopyOptions = {}): Promise<CopyResult> {
  // Validate input
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      error: 'Invalid text provided for copying'
    };
  }

  // Trim text to prevent copying unnecessary whitespace
  const trimmedText = text.trim();
  
  if (trimmedText.length === 0) {
    return {
      success: false,
      error: 'Cannot copy empty text'
    };
  }

  const { fallbackMethod = true, timeout = 5000 } = options;

  // Try modern Clipboard API first
  const primaryResult = await copyWithClipboardAPI(trimmedText, timeout);
  
  if (primaryResult.success) {
    return primaryResult;
  }

  // If modern API failed and fallback is enabled, try execCommand
  if (fallbackMethod) {
    const fallbackResult = copyWithExecCommand(trimmedText);
    
    if (fallbackResult.success) {
      return fallbackResult;
    }
    
    // Both methods failed
    return {
      success: false,
      error: `Primary method failed: ${primaryResult.error}. Fallback method failed: ${fallbackResult.error}`
    };
  }

  // Return primary error if fallback is disabled
  return primaryResult;
}

/**
 * Utility function to check if clipboard operations are supported
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard || document.execCommand);
}

/**
 * Utility function to get clipboard support details
 */
export function getClipboardSupport(): {
  modernAPI: boolean;
  fallbackAPI: boolean;
  supported: boolean;
} {
  const modernAPI = !!navigator.clipboard;
  const fallbackAPI = !!document.execCommand;
  
  return {
    modernAPI,
    fallbackAPI,
    supported: modernAPI || fallbackAPI
  };
} 