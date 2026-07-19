import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

export class DocConverter {
  /**
   * Converts a Word document (.doc or .docx) into a standardized .docx with all
   * legacy equations (MathType, equation fields) converted into native OMML formulas.
   * Requires Microsoft Word to be installed on the system.
   */
  static async convertAndNormalize(inputPath: string, outputPath: string): Promise<void> {
    const absoluteInput = path.resolve(inputPath).replace(/\//g, '\\');
    const absoluteOutput = path.resolve(outputPath).replace(/\//g, '\\');

    // PowerShell command template
    // We escape backslashes and double quotes for PowerShell command execution
    const escapedInput = absoluteInput.replace(/'/g, "''");
    const escapedOutput = absoluteOutput.replace(/'/g, "''");

    const psCommand = `
      $ErrorActionPreference = 'Stop';
      $word = $null;
      $doc = $null;
      try {
        $word = New-Object -ComObject Word.Application;
        $word.Visible = $false;
        $doc = $word.Documents.Open('${escapedInput}', $false, $true);
        
        if ($doc.OMaths -and $doc.OMaths.Count -gt 0) {
          $doc.OMaths.Convert();
        }
        
        $doc.SaveAs2('${escapedOutput}', 16);
        $doc.Close($false);
        $word.Quit();
        Write-Output "SUCCESS";
      } catch {
        if ($doc) {
          try { $doc.Close($false) } catch {}
        }
        if ($word) {
          try { $word.Quit() } catch {}
        }
        Write-Error $_.Exception.Message;
        exit 1;
      }
    `;

    try {
      // Flatten the script into a single-line command for safety in cmd/powershell execution
      const commandString = psCommand.replace(/\r?\n/g, ' ').trim();
      const { stdout, stderr } = await execPromise(`powershell -Command "${commandString}"`);
      
      if (stderr && stderr.trim().length > 0 && !stdout.includes('SUCCESS')) {
        throw new Error(stderr);
      }
      
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Output standardized document was not created at ${outputPath}`);
      }
    } catch (err: any) {
      console.error('[DocConverter Error]', err);
      throw new Error(`Word Document Normalization failed: ${err.message}`);
    }
  }
}
