package command

import (
	"github.com/breeve/deliver/pkg/terminal/utils/command"
	"github.com/spf13/cobra"
)

func RootCommand() (root *command.Command, err error) {
	var rootCmd = &cobra.Command{
		Use:   "app",
		Short: "",
		Long:  ``,
	}

	return command.NewCommand(rootCmd), nil
}
